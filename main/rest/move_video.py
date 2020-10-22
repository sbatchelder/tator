import logging
import os
import mimetypes
import random
from uuid import uuid1

from rest_framework.authtoken.models import Token
from django.conf import settings
from django.http import Http404
from urllib import parse as urllib_parse

from ..kube import TatorAlgorithm
from ..models import Algorithm
from ..models import Media
from ..models import MediaType
from ..schema import MoveVideoSchema
from ..cache import TatorCache
from ..uploads import download_uploaded_file
from ..uploads import get_destination_path
from ..uploads import get_file_path
from ..uploads import make_symlink

from ._attributes import patch_attributes
from ._attributes import validate_attributes
from ._base_views import BaseListView
from ._permissions import ProjectTransferPermission

logger = logging.getLogger(__name__)

class MoveVideoAPI(BaseListView):
    """ Moves a video file.

        This endpoint creates a symlink for an uploaded video file in the
        appropriate project directory and updates the media object with the given 
        `media_files` definitions.

        Videos in Tator must be transcoded to a multi-resolution streaming format before they
        can be viewed or annotated. To launch a transcode on raw uploaded video, use the
        `Transcode` endpoint, which will create an Argo workflow to perform the transcode
        and save the video using this endpoint; no further REST calls are required. However,
        if you would like to perform transcodes locally, this endpoint enables that. The
        module `tator.transcode` in the tator pip package provides local transcode capability
        using this endpoint.
    """
    schema = MoveVideoSchema()
    permission_classes = [ProjectTransferPermission]
    http_method_names = ['post']

    def _post(self, params):
        # Get the project
        media = Media.objects.get(pk=params['id'])
        project = media.project.pk

        # Get the token
        token, _ = Token.objects.get_or_create(user=self.request.user)

        # Determine the move paths and update media_files with new paths.
        media_files = params['media_files']
        move_list = []
        moved_archival = False
        if 'archival' in media_files:
            for video_def in media_files['archival']:

                # Determine extension based on codec_mime field, if present. If it is
                # not present, assume the file is a copy of the original with a name
                # matching the name of the media record.
                if 'codec_mime' in video_def:
                    ext = mimetypes.guess_extension(video_def['codec_mime'].split(';')[0])
                else:
                    ext = os.path.splitext(media.name)[1]
                path = f"{project}/{str(uuid1())}{ext}"
                dst = os.path.join(get_destination_path(settings.RAW_ROOT, project), path)
                make_symlink(video_def['url'], token, dst)
                video_def['path'] = dst
                del video_def['url']
                moved_archival = True
        if 'streaming' in media_files:
            for video_def in media_files['streaming']:
                uuid = str(uuid1())
                path = f"{project}/{uuid}.mp4"
                segment_info = f"{uuid}_segments.json"
                dst = os.path.join(get_destination_path(settings.MEDIA_ROOT, project), path)
                segment_dst = os.path.join(os.path.dirname(dst), segment_info)
                make_symlink(video_def['url'], token, dst)
                download_uploaded_file(video_def['segments_url'], self.request.user, segment_dst)
                video_def['path'] = dst
                video_def['segment_info'] = segment_dst
                del video_def['url']
                del video_def['segments_url']
        if 'audio' in media_files:
            for audio_def in media_files['audio']:
                path = f"{project}/{str(uuid1())}.m4a"
                dst = os.path.join(get_destination_path(settings.MEDIA_ROOT, project), path)
                make_symlink(audio_def['url'], token, dst)
                audio_def['path'] = dst
                del audio_def['url']

        media.update_media_files(media_files)
        media.save()

        response_data = {'message': f"Moved video for media {params['id']}!",
                         'id': params['id']}

        if moved_archival:

            run_algo = False
            alg_on_archival = 'Algorithm On Archival'
            alg_on_archival_launched = 'Algorithm On Archival Launched'

            if alg_on_archival in media.attributes and alg_on_archival_launched in media.attributes:
                if media.attributes[alg_on_archival_launched] == False:
                    run_algo = True
                    alg_name = media.attributes[alg_on_archival]

            else:
                media_type_obj = MediaType.objects.get(pk=media.meta_id)
                
                found_alg_on_archival = False
                found_alg_on_archival_launched = False
                for attr_type in media_type_obj.attribute_types:
                    if attr_type['name'] == alg_on_archival:
                        found_alg_on_archival = True
                        alg_name = attr_type['default']

                    elif attr_type['name'] == alg_on_archival_launched:
                        found_alg_on_archival_launched = True
                
                run_algo = found_alg_on_archival and found_alg_on_archival_launched

            if run_algo:
                alg_obj = Algorithm.objects.filter(project__id=project)
                alg_obj = alg_obj.filter(name=alg_name)
                if len(alg_obj) != 1:
                    raise Http404
                alg_obj = alg_obj[0]
                submitter = TatorAlgorithm(alg_obj)
                sections = media.attributes['tator_user_sections']
                alg_response = submitter.start_algorithm(
                    media_ids=f"{media.id}",
                    sections=sections,
                    gid=media.gid,
                    uid=media.uid,
                    token=token,
                    project=project,
                    user=self.request.user.pk,
                    extra_params=[]
                )

                params_attrs = {'attributes':{
                    alg_on_archival: alg_name,
                    alg_on_archival_launched : True
                }}
                new_attrs = validate_attributes(params_attrs, media)
                media = patch_attributes(new_attrs, media)
                media.save()

                response_data = {'message': f"Moved video for media {params['id']} and launched algorithm {alg_name}!",
                                'id': params['id']}

        return response_data
        
    def get_queryset(self):
        return Media.objects.all()
