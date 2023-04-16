""" TODO: add documentation for this """
from collections import defaultdict
import logging

import json
import base64

from django.db.models.functions import Coalesce
from django.db.models import Q

from ..search import TatorSearch
from ..models import Leaf
from ..models import LeafType

from ._attribute_query import get_attribute_filter_ops
from ._attribute_query import get_attribute_psql_queryset
from ._attributes import KV_SEPARATOR
from ._float_array_query import get_float_array_query

logger = logging.getLogger(__name__)

def _get_leaf_psql_queryset(project, filter_ops, params):
    """ Constructs a psql queryset.
    """
    # Get query parameters.
    leaf_id = params.get('leaf_id')
    leaf_id_put = params.get('ids', None) # PUT request only
    project = params['project']
    filter_type = params.get('type')
    name = params.get('name')
    start = params.get('start')
    stop = params.get('stop')
    depth = params.get('depth')

    qs = Leaf.objects.filter(project=project, deleted=False)

    leaf_ids = []
    id_supplied = False
    if leaf_id is not None:
        leaf_ids += leaf_id
        id_supplied = True
    if leaf_id_put is not None:
        leaf_ids += leaf_id_put
        id_supplied = True
    if id_supplied:
        if leaf_ids == []:
            qs = qs.filter(pk=-1)
        else:
            qs = qs.filter(pk__in=leaf_ids)

    if depth is not None:
        qs = qs.filter(path__depth=depth)

    if name is not None:
        qs = qs.filter(name=name)

    if filter_type is not None:
        qs = get_attribute_psql_queryset(project, LeafType.objects.get(pk=filter_type), qs, params, filter_ops)
        qs = qs.filter(type=filter_type)
    if filter_ops:
        queries = []
        for entity_type in LeafType.objects.filter(project=project):
            sub_qs = get_attribute_psql_queryset(project, entity_type, qs, params, filter_ops)
            if sub_qs:
                queries.append(sub_qs.filter(type=entity_type))
        logger.info(f"Joining {len(queries)} queries together.")
        if queries:
            query = Q(pk__in=sub_qs)
            for r in queries:
                query = query | Q(pk__in=r)
            qs = qs.filter(query)
        else:
            qs = sub_qs

    if params.get('object_search'):
        qs = get_attribute_psql_queryset_from_query_obj(qs, params.get('object_search'))

    # Used by GET queries
    if params.get('encoded_search'):
        search_obj = json.loads(base64.b64decode(params.get('encoded_search')).decode())
        qs = get_attribute_psql_queryset_from_query_obj(qs, search_obj)

    qs = qs.order_by('id')

    if start is not None and stop is not None:
        qs = qs[start:stop]
    elif start is not None:
        qs = qs[start:]
    elif stop is not None:
        qs = qs[:stop]

    logger.info(qs.explain())
    return qs

def get_leaf_queryset(project, params):
    # Determine whether to use ES or not.
    project = params.get('project')
    filter_type = params.get('type')
    filter_ops=[]
    if filter_type:
        types = LeafType.objects.filter(pk=filter_type)
    else:
        types = LeafType.objects.filter(project=project)
    for entity_type in types:
        filter_ops.extend(get_attribute_filter_ops(project, params, entity_type))

    # If using PSQL, construct the queryset.
    qs = _get_leaf_psql_queryset(project, filter_ops, params)
    return qs

def get_leaf_count(project, params):
    return get_leaf_queryset(project,params).count()

