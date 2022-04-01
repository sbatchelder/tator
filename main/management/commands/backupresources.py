from collections import defaultdict
import logging
from typing import Iterable

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from main.backup import TatorBackupManager
from main.models import Affiliation, Project, Resource, User
from main.ses import TatorSES


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Backs up any resource objects with `backed_up==False`."

    def handle(self, **options):
        resource_qs = Resource.objects.filter(media__deleted=False, backed_up=False)
        total_to_back_up = resource_qs.count()
        if total_to_back_up == 0:
            logger.info(f"No resources to back up!")
            return

        backup_mgr = TatorBackupManager()
        failed_backups = defaultdict(set)
        successful_backups = set()
        for resource in resource_qs.iterator():
            path = resource.path

            # Resource path looks like "org_id/proj_id/media_id/filename"
            proj_id, media_id = path.split("/")[1:3]

            if backup_mgr.backup_resource(path, Project.objects.get(pk=proj_id)):
                successful_backups.add(resource.id)
            else:
                failed_backups[proj_id].add(media_id)

            if idx + 1 % 1000 == 0:
                logger.info(f"Processed {idx + 1} of {total_to_back_up} resources")

        with transaction.atomic():
            resource_qs = Resource.objects.select_for_update().filter(pk__in=successful_backups)
            resource_qs.update(backed_up=True)

        logger.info(
            f"Backed up {len(successful_backups)} of {total_to_back_up} resources needing backup!"
        )

        if failed_backups:
            # Notify owners of failed backup attempt
            if settings.TATOR_EMAIL_ENABLED:
                ses = TatorSES()
            else:
                ses = None

            for project_id, failed_media_ids in failed_backups.items():
                msg = (
                    f"Failed to back up at least one resource from each of the following media: "
                    f"{list(failed_media_ids)}"
                )
                logger.warning(msg)

                if ses:
                    project = Project.objects.get(pk=project_id)

                    # Get project administrators
                    recipient_ids = Affiliation.objects.filter(
                        organization=project.organization, permission="Admin"
                    ).values_list("user", flat=True)
                    recipients = list(
                        User.objects.filter(pk__in=recipient_ids).values_list("email", flat=True)
                    )

                    ses.email(
                        sender=settings.TATOR_EMAIL_SENDER,
                        recipients=recipients,
                        title=f"Nightly backup for {project.name} ({project.id}) failed",
                        text=msg,
                    )
