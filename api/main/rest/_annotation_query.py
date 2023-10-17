""" TODO: add documentation for this """
import logging

import json
import base64
import uuid

from django.db.models import Subquery
from django.db.models.functions import Coalesce
from django.db.models import Q

from ..models import Localization, LocalizationType, Media, MediaType, Section, State, StateType

from ..schema._attributes import related_keys

from ._media_query import _related_search

from ._attribute_query import (
    get_attribute_filter_ops,
    get_attribute_psql_queryset,
    get_attribute_psql_queryset_from_query_obj,
    supplied_name_to_field,
    _look_for_section_uuid,
)

logger = logging.getLogger(__name__)

ANNOTATION_LOOKUP = {"localization": Localization, "state": State}

ANNOTATION_TYPE_LOOKUP = {"localization": LocalizationType, "state": StateType}


def _do_object_search(qs, params):
    if params.get("object_search"):
        qs = get_attribute_psql_queryset_from_query_obj(qs, params.get("object_search"))

    # Used by GET queries
    if params.get("encoded_search"):
        search_obj = json.loads(base64.b64decode(params.get("encoded_search").encode()).decode())
        qs = get_attribute_psql_queryset_from_query_obj(qs, search_obj)

    return qs


def _get_annotation_psql_queryset(project, filter_ops, params, annotation_type):
    """Constructs a psql queryset."""

    logger.info(f"PARAMS={params}")
    # Get query parameters.
    media_id = params.get("media_id")
    media_id_put = params.get("media_ids")  # PUT request only
    if annotation_type == "localization":
        localization_id_put = params.get("ids")  # PUT request only
        state_ids = params.get("state_ids")  # PUT request only
    elif annotation_type == "state":
        localization_id_put = params.get("localization_ids")  # PUT request only
        state_ids = params.get("ids")  # PUT request only
    filter_type = params.get("type")
    version = params.get("version")
    frame = params.get("frame")
    after = params.get("after")
    apply_merge = params.get("merge")
    start = params.get("start")
    stop = params.get("stop")
    elemental_id = params.get("elemental_id")

    qs = ANNOTATION_LOOKUP[annotation_type].objects.filter(project=project, deleted=False)
    media_ids = []
    if media_id_put is not None:
        media_ids += media_id_put
    if media_id is not None:
        media_ids += media_id
    if media_ids:
        qs = qs.filter(media__in=media_ids)
        if len(media_ids) > 1:
            qs = qs.distinct()

    localization_ids = []
    if localization_id_put:
        localization_ids += localization_id_put
    if state_ids and (annotation_type == "localization"):
        localization_ids += list(
            State.localizations.through.objects.filter(state__in=state_ids)
            .values_list("localization_id", flat=True)
            .distinct()
        )
    if localization_ids:
        if annotation_type == "localization":
            qs = qs.filter(pk__in=localization_ids)
        elif annotation_type == "state":
            qs = qs.filter(localizations__in=localization_ids).distinct()

    if state_ids and (annotation_type == "state"):
        qs = qs.filter(pk__in=state_ids)

    if version is not None:
        qs = qs.filter(version__in=version)

    if elemental_id is not None:
        # Django 3.X has a bug where UUID fields aren't escaped properly
        # Use .extra to manually validate the input is UUID
        # Then construct where clause manually.
        safe = uuid.UUID(elemental_id)
        qs = qs.extra(where=[f"elemental_id='{str(safe)}'"])

    if frame is not None:
        qs = qs.filter(frame=frame)

    if after is not None:
        qs = qs.filter(pk__gt=after)

    relevant_media_type_ids = (
        ANNOTATION_TYPE_LOOKUP[annotation_type]
        .objects.filter(project=project)
        .values_list("media")
        .distinct()
    )
    if filter_type is not None:
        qs = get_attribute_psql_queryset(
            ANNOTATION_TYPE_LOOKUP[annotation_type].objects.get(pk=filter_type),
            qs,
            params,
            filter_ops,
        )
        qs = qs.filter(type=filter_type)
        relevant_media_type_ids = (
            ANNOTATION_TYPE_LOOKUP[annotation_type]
            .objects.filter(pk=filter_type)
            .values_list("media")
            .distinct()
        )
    elif filter_ops or params.get("float_array", None):
        queries = []
        for entity_type in ANNOTATION_TYPE_LOOKUP[annotation_type].objects.filter(project=project):
            sub_qs = get_attribute_psql_queryset(entity_type, qs, params, filter_ops)
            if type(sub_qs) != type(None):
                queries.append(sub_qs.filter(type=entity_type))
        logger.info(f"Joining {len(queries)} queries together.")
        sub_qs = queries.pop()
        if queries:
            query = Q(pk__in=sub_qs)
            for r in queries:
                query = query | Q(pk__in=r)
            qs = qs.filter(query)
        else:
            qs = sub_qs

    if "section" in params:
        section = Section.objects.get(pk=params["section"])
        media_ids = []
        # This iteration ensures the scoped UUID index is used
        for media_type_id in relevant_media_type_ids:
            section_uuid = section.tator_user_sections
            object_search = section.object_search
            related_object_search = section.related_object_search
            media_qs = Media.objects.filter(project=project, type=media_type_id)
            if section_uuid:
                media_qs = _look_for_section_uuid(media_qs, section_uuid)
            if object_search:
                media_qs = get_attribute_psql_queryset_from_query_obj(media_qs, object_search)
            if related_object_search:
                media_state_types = StateType.objects.filter(project=project)
                media_localization_types = Localization.objects.filter(project=project)
                media_qs = _related_search(
                    media_qs,
                    project,
                    media_state_types,
                    media_localization_types,
                    related_object_search,
                )
            media_ids.append(media_qs)
        query = Q(media__in=media_ids.pop())
        for m in media_ids:
            query = query | Q(media__in=m)
        qs = qs.filter(query)

    # Do a related query
    if any([x in params for x in related_keys if x.startswith("related_")]):
        related_media_types = MediaType.objects.filter(pk__in=relevant_media_type_ids)
        matches = [x for x in related_keys if x in params]
        faux_params = {key.replace("related_", ""): params[key] for key in matches}
        logger.info(faux_params)
        related_matches = []
        for entity_type in related_media_types:
            faux_filter_ops = get_attribute_filter_ops(faux_params, entity_type)
            if faux_filter_ops:
                related_matches.append(
                    get_attribute_psql_queryset(
                        entity_type,
                        Media.objects.filter(project=project),
                        faux_params,
                        faux_filter_ops,
                    )
                )
        if related_matches:
            related_match = related_matches.pop()
            query = Q(media__in=related_match)
            for r in related_matches:
                query = query | Q(media__in=r)
            qs = qs.filter(query).distinct()

    if params.get("encoded_related_search"):
        search_obj = json.loads(
            base64.b64decode(params.get("encoded_related_search").encode()).decode()
        )
        related_media_types = MediaType.objects.filter(pk__in=relevant_media_type_ids)
        related_matches = []
        for entity_type in related_media_types:
            media_qs = Media.objects.filter(project=project, type=entity_type)
            media_qs = get_attribute_psql_queryset_from_query_obj(media_qs, search_obj)
            if media_qs.count():
                related_matches.append(media_qs)
        if related_matches:
            related_match = related_matches.pop()
            query = Q(media__in=related_match)
            for r in related_matches:
                query = query | Q(media__in=r)
            qs = qs.filter(query).distinct()
        else:
            qs = qs.filter(pk=-1)

    qs = _do_object_search(qs, params)
    if params.get("related_id"):
        if annotation_type == "localization":
            state_qs = State.objects.filter(pk__in=params.get("related_id"))
            qs = qs.filter(pk__in=state_qs.values("localizations"))
        elif annotation_type == "state":
            qs = qs.filter(localizations__in=params.get("related_id"))

    if apply_merge:
        # parent_set = ANNOTATION_LOOKUP[annotation_type].objects.filter(pk__in=Subquery())
        objects_with_parents = qs.filter(parent__isnull=False)
        qs = qs.exclude(pk__in=objects_with_parents.values("parent"))

    show_deleted = params.get("show_deleted")
    if not show_deleted:
        qs = qs.filter(variant_deleted=False)

    if params.get("float_array", None) == None:
        if params.get("sort_by", None):
            sortables = [supplied_name_to_field(x) for x in params.get("sort_by")]
            qs = qs.order_by(*sortables)
        else:
            qs = qs.order_by("id")

    if (start is not None) and (stop is not None):
        qs = qs[start:stop]
    elif start is not None:
        qs = qs[start:]
    elif stop is not None:
        qs = qs[:stop]

    # Useful for profiling / checking out query complexity
    logger.info(f"QUERY={qs.query}")
    logger.info(f"EXPLAIN={qs.explain()}")

    return qs


def get_annotation_queryset(project, params, annotation_type):
    # annotation_type is either localization or state
    filter_type = params.get("type")
    filter_ops = []
    if filter_type:
        types = ANNOTATION_TYPE_LOOKUP[annotation_type].objects.filter(pk=filter_type)
    else:
        types = ANNOTATION_TYPE_LOOKUP[annotation_type].objects.filter(project=project)
    for entity_type in types:
        filter_ops.extend(get_attribute_filter_ops(params, entity_type))
    qs = _get_annotation_psql_queryset(project, filter_ops, params, annotation_type)
    return qs


def get_annotation_count(project, params, annotation_type):
    return get_annotation_queryset(project, params, annotation_type).count()
