from rest_framework.schemas.openapi import SchemaGenerator

from .components import *

class CustomGenerator(SchemaGenerator):
    """ Schema generator for Swagger UI.
    """
    def get_schema(self, request=None, public=True, parser=False):
        schema = super().get_schema(request, public)

        # Set up schema components.
        schema['components'] = {
            'schemas': {
                'AlgorithmLaunchSpec': algorithm_launch_spec,
                'AlgorithmLaunchResponse': algorithm_launch_response,
                'Algorithm': algorithm,
                'AnalysisSpec': analysis_spec,
                'Analysis': analysis,
                'AttributeTypeSpec': attribute_type_spec,
                'AttributeType': attribute_type,
                'AttributeTypeUpdate': attribute_type_update,
                'LocalizationSpec': localization_spec,
                'LocalizationUpdate': localization_update,
                'Localization': localization,
                'VideoSpec': video_spec,
                'VideoUpdate': video_update,
                'CreateResponse': create_response,
                'MessageResponse': message_response,
                'AttributeBulkUpdate': attribute_bulk_update,
            },
        }

        # Add schema for Token endpoint.
        if not parser:
            schema['paths']['/rest/Token']['post']['requestBody'] = {
                'content': {'application/json': {
                    'schema': {
                        'type': 'object',
                        'required': ['username', 'password'],
                        'properties': {
                            'username': {
                                'description': 'Account username.',
                                'type': 'string',
                            },
                            'password': {
                                'description': 'Account password.',
                                'type': 'string',
                            },
                        },
                    },
                }},
            }
            schema['paths']['/rest/Token']['post']['responses'] = {
                '200': {
                    'description': 'Login credentials accepted.',
                    'content': {'application/json': {
                        'schema': {
                            'type': 'object',
                            'properties': {
                                'token': {
                                    'description': 'API token.',
                                    'type': 'string',
                                },
                            },
                        },
                    }},
                },
                400: {'description': 'Login credentials invalid.'},
            }
            schema['paths']['/rest/Token']['post']['tags'] = ['Tator']

            # Set security scheme.
            schema['components']['securitySchemes'] = {
                'TokenAuth': {
                    'type': 'apiKey',
                    'in': 'header',
                    'name': 'Authorization',
                },
            }
            schema['security'] = [
                {'TokenAuth': []},
            ]

            # Remove deprecated paths.
            deprecated = [
                '/rest/EntityTypeMedias/{project}',
                '/rest/EntityTypeMedia/{id}',
                '/rest/EntityMedia/{id}',
                '/rest/EntityMedias/{project}',
                '/rest/EntityState/{id}',
                '/rest/EntityStates/{project}',
                '/rest/EntityStateTypes/{project}',
                '/rest/EntityStateType/{id}',
                '/rest/TreeLeafTypes/{project}',
                '/rest/TreeLeafType/{id}',
                '/rest/TreeLeaves/{project}',
                '/rest/TreeLeaf/{id}',
                '/rest/TreeLeaves/Suggestion/{ancestor}/{project}',
            ]
            for d in deprecated:
                if d in schema['paths']:
                    del schema['paths'][d]

        return schema

