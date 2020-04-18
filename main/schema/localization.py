from rest_framework.schemas.openapi import AutoSchema

from ._attributes import attribute_filter_parameter_schema

localization_properties = {
    'x': {
        'description': 'Normalized horizontal position of left edge of bounding box for '
                       '`box` localization types, or horizontal position of dot for `dot` '
                       'annotation types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'y': {
        'description': 'Normalized vertical position of top edge of bounding box for '
                       '`box` localization types, or vertical position of dot for `dot` '
                       'annotation types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'width': {
        'description': 'Normalized width of bounding box for `box` localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'height': {
        'description': 'Normalized height of bounding box for `box` localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'x0': {
        'description': 'Normalized horizontal position of start of line for `line` '
                       'localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'y0': {
        'description': 'Normalized vertical position of start of line for `line` '
                       'localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'x1': {
        'description': 'Normalized horizontal position of end of line for `line` '
                       'localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'y1': {
        'description': 'Normalized vertical position of end of line for `line` '
                       'localization types.',
        'type': 'number',
        'minimum': 0.0,
        'maximum': 1.0,
    },
    'frame': {
        'description': 'Frame number of this localization if it is in a video.',
        'type': 'integer',
    },
}

class LocalizationListSchema(AutoSchema):
    def get_operation(self, path, method):
        operation = super().get_operation(path, method)
        operation['tags'] = ['Localization']
        return operation

    def _get_path_parameters(self, path, method):
        return [{
            'name': 'project',
            'in': 'path',
            'required': True,
            'description': 'A unique integer identifying a project.',
            'schema': {'type': 'integer'},
        }]

    def _get_filter_parameters(self, path, method):
        params = []
        if method in ['GET', 'PATCH', 'DELETE']:
            params = [
                {
                    'name': 'media_id',
                    'in': 'query',
                    'required': False,
                    'description': 'Unique integer identifying a media element.',
                    'schema': {'type': 'integer'},
                },
                {
                    'name': 'type',
                    'in': 'query',
                    'required': False,
                    'description': 'Unique integer identifying a localization type.',
                    'schema': {'type': 'integer'},
                },
                {
                    'name': 'version',
                    'in': 'query',
                    'required': False,
                    'description': 'Unique integer identifying a version.',
                    'schema': {'type': 'integer'},
                },
                {
                    'name': 'modified',
                    'in': 'query',
                    'required': False,
                    'description': 'Whether to return original or modified localizations, 0 or 1.',
                    'schema': {
                        'type': 'integer',
                        'enum': [0, 1],
                    },
                },
                {
                    'name': 'operation',
                    'in': 'query',
                    'required': False,
                    'description': 'Set to "count" to return a count of objects instead of the objects.',
                    'schema': {
                        'type': 'string',
                        'enum': ['count'],
                    },
                },
            ] + attribute_filter_parameter_schema
        return params

    def _get_request_body(self, path, method):
        body = {}
        if method == 'POST':
            body = {'content': {'application/json': {
                'schema': {
                    'type': 'object',
                    'required': ['media_id', 'type'],
                    'additionalProperties': True,
                    'properties': {
                        'media_id': {
                            'description': 'Unique integer identifying a media.',
                            'type': 'integer',
                        },
                        'type': {
                            'description': 'Unique integer identifying a localization type.',
                            'type': 'integer',
                        },
                        'many': {
                            'description': 'List of localizations if this request is for bulk'
                                           'create.',
                            'type': 'array',
                            'items': {
                                'type': 'object',
                                'additionalProperties': True,
                                'properties': localization_properties,
                            }
                        },
                        'version': {
                            'description': 'Unique integer identifying the version.',
                            'type': 'integer',
                        },
                        'modified': {
                            'description': 'Integer specifying relative order this attribute '
                                           'is displayed in the UI. Negative values are hidden '
                                           'by default.',
                            'type': 'boolean',
                            'default': 0,
                        },
                        **localization_properties,
                    },
                },
                'examples': {
                    'box': {
                        'summary': 'Single box localization',
                        'value': {
                            'media_id': 1,
                            'type': 1,
                            'x': 0.1,
                            'y': 0.2,
                            'width': 0.3,
                            'height': 0.4,
                            'frame': 1000,
                            'My First Attribute': 'value1',
                            'My Second Attribute': 'value2',
                        },
                    },
                    'boxes': {
                        'summary': 'Many box localizations',
                        'value': {
                            'media_id': 1,
                            'type': 1,
                            'many': [
                                {
                                    'x': 0.1,
                                    'y': 0.2,
                                    'width': 0.3,
                                    'height': 0.4,
                                    'frame': 100,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                                {
                                    'x': 0.1,
                                    'y': 0.2,
                                    'width': 0.3,
                                    'height': 0.4,
                                    'frame': 1000,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                            ],
                        },
                    },
                    'line': {
                        'summary': 'Single line localization',
                        'value': {
                            'media_id': 1,
                            'type': 2,
                            'x0': 0.1,
                            'y0': 0.2,
                            'x1': 0.3,
                            'y1': 0.4,
                            'frame': 1000,
                            'My First Attribute': 'value1',
                            'My Second Attribute': 'value2',
                        },
                    },
                    'lines': {
                        'summary': 'Many line localizations',
                        'value': {
                            'media_id': 1,
                            'type': 2,
                            'many': [
                                {
                                    'x0': 0.1,
                                    'y0': 0.2,
                                    'x1': 0.3,
                                    'y1': 0.4,
                                    'frame': 100,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                                {
                                    'x0': 0.1,
                                    'y0': 0.2,
                                    'x1': 0.3,
                                    'y1': 0.4,
                                    'frame': 1000,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                            ],
                        },
                    },
                    'dot': {
                        'summary': 'Single dot localization',
                        'value': {
                            'media_id': 1,
                            'type': 1,
                            'x': 0.1,
                            'y': 0.2,
                            'frame': 1000,
                            'My First Attribute': 'value1',
                            'My Second Attribute': 'value2',
                        },
                    },
                    'dots': {
                        'summary': 'Many dot localizations',
                        'value': {
                            'media_id': 1,
                            'type': 1,
                            'many': [
                                {
                                    'x': 0.1,
                                    'y': 0.2,
                                    'frame': 100,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                                {
                                    'x': 0.1,
                                    'y': 0.2,
                                    'frame': 1000,
                                    'My First Attribute': 'value1',
                                    'My Second Attribute': 'value2',
                                },
                            ],
                        },
                    },
                }
            }}}
        if method == 'PATCH':
            body = {'content': {'application/json': {
                'schema': {
                    'type': 'object',
                    'required': ['attributes'],
                    'properties': {
                        'attributes': {
                            'description': 'Attribute values to bulk update.',
                            'type': 'object',
                            'additionalProperties': True,
                        },
                    },
                },
                'examples': {
                    'single': {
                        'summary': 'Update Species attribute of many localizations',
                        'value': {
                            'attributes': {
                                'Species': 'Tuna',
                            }
                        },
                    },
                }
            }}}
        return body

    def _get_responses(self, path, method):
        responses = {}
        responses['404'] = {'description': 'Failure to find project with given ID.'}
        responses['400'] = {'description': 'Bad request.'}
        if method == 'GET':
            responses['200'] = {'description': 'Successful retrieval of localization list.'}
        elif method == 'POST':
            responses['201'] = {'description': 'Successful creation of localization(s).'}
        elif method == 'PATCH':
            responses['200'] = {'description': 'Successful bulk update of localization '
                                               'attributes.'}
        elif method == 'DELETE':
            responses['204'] = {'description': 'Successful bulk delete of localizations.'}
        return responses

