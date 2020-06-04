localization_type_properties = {
    'name': {
        'type': 'string',
        'description': 'Name of the localization type.',
    },
    'description': {
        'type': 'string',
        'description': 'Description of the localization type.',
    },
    'dtype': {
        'type': 'string',
        'description': 'Shape of this localization type.',
        'enum': ['box', 'line', 'dot'],
    },
    'attribute_types': {
        'description': 'Attribute type definitions.',
        'type': 'array',
        'items': {'$ref': '#/components/schemas/AttributeType'},
    },
}

localization_type_spec = {
    'type': 'object',
    'required': ['name', 'dtype', 'media_types'],
    'properties': {
        **localization_type_properties,
        'media_types': {
            'description': 'List of integers identifying media types that '
                           'this localization type may apply to.',
            'type': 'array',
            'items': {
                'type': 'integer',
                'minimum': 1,
            },
        },
    },
}

localization_type_update = {
    'type': 'object',
    'description': 'Localization type update.',
    'properties': {
        'description': localization_type_properties['description'],
        'name': localization_type_properties['name'],
    },
}

localization_type = {
    'type': 'object',
    'description': 'Localization type.',
    'type': 'object',
    'properties': {
        'id': {
            'type': 'integer',
            'description': 'Unique integer identifying a localization type.',
        },
        'project': {
            'type': 'integer',
            'description': 'Unique integer identifying project for this leaf type.',
        },
        'colorMap': {
            'type': 'object',
            'additionalProperties': True,
        },
        'line_width': {
            'type': 'integer',
            'description': 'Width of the line used to draw the localization.',
            'minimum': 1,
        },
        'visible': {
            'type': 'boolean',
            'description': 'Whether this type should be displayed in the UI.',
            'default': True,
        },
        **localization_type_properties,
    },
}

