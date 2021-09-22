import os
import time


from ._common import print_page_error

## Status: In progress
# Goals:
# - Edited: Project; Todo: Assert changes stick single edits
# - Create, Assert & Edit: Media Type-Image, Media Type-Video, Media Type-MultiView
# - Create, Assert & Edit: Localization Type-Box, Localization Type-Dot, Localization Type-Line, [Localization Type-Poly]
# - State Type
# - Membership
# - Versions
# - Algorithm
# - Created, Edited, Cloned & Edit (Assert all steps) - 7 Attribute types
def test_settings_projectEdit(authenticated, project, image_file):
    print("Opening settings page...")
    page = authenticated.new_page()
    page.goto(f"/{project}/project-settings")
    page.on("pageerror", print_page_error)

    # Update All Project information
    print("Start: Editing project info via Project Settings")
    page.wait_for_selector('project-main-edit')
    page.fill('project-main-edit text-input[name="Name"] input', 'Updated Name ' + str(project))
    page.set_input_files('input[type="file"]', image_file)
    page.fill('project-main-edit text-input[name="Summary"] input', 'Updated Description...')
    page.click('project-main-edit label[for="off"]')
    page.click('project-main-edit input[type="submit"]')
    page.wait_for_selector(f'text="Project {project} updated successfully!"')
    print(f"Project {project} updated successfully!")
    page.click('modal-dialog modal-close .modal__close')


# def test_settings_mediaTypes(authenticated, project):
#     print("Test Media types: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     print("Start: Creating Media Types via Project Settings")
#     # Create Media types ##todo why are multiple of each being created?
#     page.click('.heading-for-MediaType .Nav-action')
#     page.fill('#itemDivId-MediaType-New text-input[name="Name"] input', 'My Video Type')
#     page.select_option('#itemDivId-MediaType-New enum-input[name="Data Type"] select', label='Video')
#     page.fill('#itemDivId-MediaType-New text-input[name="Description"] input', 'Media description for automated test.')
#     page.fill('#itemDivId-MediaType-New text-input[name="Default volume"] input', '50')
#     page.click('#itemDivId-MediaType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-MediaType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Media type created successfully!"')
#     print(f"Video Media type created successfully!")
#     page.click('modal-dialog modal-close .modal__close')
#     page.click('.heading-for-MediaType .Nav-action')
#     page.fill('#itemDivId-MediaType-New text-input[name="Name"] input', 'My Image Type')
#     page.select_option('#itemDivId-MediaType-New enum-input[name="Data Type"] select', label='Image')
#     page.fill('#itemDivId-MediaType-New text-input[name="Description"] input', 'Media description for automated test.')
#     page.fill('#itemDivId-MediaType-New text-input[name="Default volume"] input', '50')
#     page.click('#itemDivId-MediaType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-MediaType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Media type created successfully!"')
#     print(f"Image Media type created successfully!")
#     page.click('modal-dialog modal-close .modal__close')
#     page.click('.heading-for-MediaType .Nav-action')
#     page.fill('#itemDivId-MediaType-New text-input[name="Name"] input', 'My Multiview Type')
#     page.select_option('#itemDivId-MediaType-New enum-input[name="Data Type"] select', label='Multiview')
#     page.fill('#itemDivId-MediaType-New text-input[name="Description"] input', 'Media description for automated test.')
#     page.fill('#itemDivId-MediaType-New text-input[name="Default volume"] input', '50')
#     page.click('#itemDivId-MediaType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-MediaType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Media type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Multiview Media type created successfully!")
    
# def test_settings_localizationTypes(authenticated, project):
#     print("Test Localization types: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Create Localization types
#     page.click('.heading-for-LocalizationType .Nav-action')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Name"] input', 'Auto Box Type')
#     page.select_option('#itemDivId-LocalizationType-New enum-input[name="Data Type"] select', label='Box')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Description"] input', 'Loc Type description for automated test.')
#     # page.click('#itemDivId-LocalizationType-New text-input[type="color"]')
#     # page.fill('#itemDivId-LocalizationType-New text-input[type="color"] input', '#FF69B4')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Drawable"] label[for="on"]')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Line Width"] input', '5')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New span:text("Test Images")')
#     page.click('#itemDivId-LocalizationType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Localization type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Box - Localization type created successfully!!")
    
#     page.click('.heading-for-LocalizationType .Nav-action')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Name"] input', 'Auto Line Type')
#     page.select_option('#itemDivId-LocalizationType-New enum-input[name="Data Type"] select', label='Line')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Description"] input', 'Loc Type description for automated test.')
#     # page.click('#itemDivId-LocalizationType-New text-input[type="color"]')
#     # page.fill('#itemDivId-LocalizationType-New text-input[type="color"] input', '#FF69B4')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Drawable"] label[for="on"]')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Line Width"] input', '5')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New span:text("Test Images")')
#     page.click('#itemDivId-LocalizationType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Localization type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Line - Localization type created successfully!!")
    
#     page.click('.heading-for-LocalizationType .Nav-action')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Name"] input', 'Auto Dot Type')
#     page.select_option('#itemDivId-LocalizationType-New enum-input[name="Data Type"] select', label='Dot')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Description"] input', 'Loc Type description for automated test.')
#     # page.click('#itemDivId-LocalizationType-New text-input[type="color"]')
#     # page.fill('#itemDivId-LocalizationType-New text-input[type="color"] input', '#FF69B4')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Drawable"] label[for="on"]')
#     page.fill('#itemDivId-LocalizationType-New text-input[name="Line Width"] input', '5')
#     page.click('#itemDivId-LocalizationType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-LocalizationType-New span:text("Test Images")')
#     page.click('#itemDivId-LocalizationType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Localization type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Dot - Localization type created successfully!!")

# def test_settings_leafType(authenticated, project):
#     print("Test Leaf types: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Create Leaf type
#     page.click('.heading-for-LeafType .Nav-action')
#     page.fill('#itemDivId-LeafType-New text-input[name="Name"] input', 'Testing Leaf')
#     page.fill('#itemDivId-LeafType-New text-input[name="Description"] input', 'Leaf Type description for automated test.')
#     page.click('#itemDivId-LeafType-New button[value="Save"]')
#     page.wait_for_selector(f'text="Leaf type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Leaf type created successfully!!")

# def test_settings_stateTypes(authenticated, project):
#     print("Test State types: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Create State types #todo hitting error with media values sent as "[None, None]"
#     page.click('.heading-for-StateType .Nav-action')
#     page.fill('#itemDivId-StateType-New text-input[name="Name"] input', 'Alabama')
#     page.fill('#itemDivId-StateType-New text-input[name="Description"] input', 'State Type description for automated test.')
#     page.click('#itemDivId-StateType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-StateType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-StateType-New span:text("My Video Type")')
#     page.click('#itemDivId-StateType-New span:text("My Image Type")')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Association"] select', label='Localization')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Interpolation"] select', label='Latest')
#     page.click('#itemDivId-StateType-New bool-input[name="Delete Child Localizations"] label[for="on"]')
#     page.click('#itemDivId-StateType-New button[value="Save"]')
#     page.click('modal-dialog modal-close .modal__close')
#     page.wait_for_selector(f'text="State type created successfully!"')
#     print(f"State type created successfully - Association: Localization, Interpolation: Latest")

#     page.click('.heading-for-StateType .Nav-action')
#     page.fill('#itemDivId-StateType-New text-input[name="Name"] input', 'Alabama')
#     page.fill('#itemDivId-StateType-New text-input[name="Description"] input', 'State Type description for automated test.')
#     page.click('#itemDivId-StateType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-StateType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-StateType-New span:text("My Video Type")')
#     page.click('#itemDivId-StateType-New span:text("My Image Type")')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Association"] select', label='Media')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Interpolation"] select', label='Latest')
#     page.click('#itemDivId-StateType-New bool-input[name="Delete Child Localizations"] label[for="on"]')
#     page.click('#itemDivId-StateType-New button[value="Save"]')
#     page.wait_for_selector(f'text="State type created successfully!"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"State type created successfully - Association: Media, Interpolation: Latest")
    
#     page.click('.heading-for-StateType .Nav-action')
#     page.fill('#itemDivId-StateType-New text-input[name="Name"] input', 'Alabama')
#     page.fill('#itemDivId-StateType-New text-input[name="Description"] input', 'State Type description for automated test.')
#     page.click('#itemDivId-StateType-New bool-input[name="Visible"] label[for="on"]')
#     page.click('#itemDivId-StateType-New bool-input[name="Grouping Default"] label[for="on"]')
#     page.click('#itemDivId-StateType-New span:text("My Video Type")')
#     page.click('#itemDivId-StateType-New span:text("My Image Type")')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Association"] select', label='Frame')
#     page.select_option('#itemDivId-StateType-New enum-input[name="Interpolation"] select', label='Latest')
#     page.click('#itemDivId-StateType-New bool-input[name="Delete Child Localizations"] label[for="on"]')
#     page.click('#itemDivId-StateType-New button[value="Save"]')
#     page.click('modal-dialog modal-close .modal__close')
#     page.wait_for_selector(f'text="State type created successfully!"')
#     print(f"State type created successfully - Association: Frame, Interpolation: Latest")


# def test_settings_projectMemberships(authenticated, project):
#     print("Test memberships: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Test memberships
#     page.click('.heading-for-Membership .Nav-action')
#     page.wait_for_selector('.subitems-Membership a:nth-child(2)')
#     username = page.query_selector('.subitems-Membership a:first-child').textContent
#     print(f"username: {username}")
#     page.click('.heading-for-Membership .Nav-action')
#     page.fill('#itemDivId-Membership-New user-input[name"Search users"]', username)
#     page.select_option('#itemDivId-Membership-New enum-input[name="Default version"] select', label='Test Version')
#     page.click('#itemDivId-Membership-New button[value="Save"]')
#     page.wait_for_selector('text="Failed to create 1 memberships. Membership already exists for project."')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Membership endpoint hit successfully!")

# def test_settings_versionTests(authenticated, project):
#     print("Test Version: Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Test Version type
#     page.click('.heading-for-heading-for-Version .Nav-action')
#     page.fill('#itemDivId-Version-New text-input[name="Name"] input', 'New Version')
#     page.fill('#itemDivId-Version-New text-input[name="Description"] input', 'Version description for automated test.')
#     page.click('#itemDivId-Version-New bool-input[name="Show Empty"] label[for="on"]')
#     page.click('#itemDivId-Version-New checkbox-set[name="Media"] label[text="Baseline"]')
#     page.click('#itemDivId-Version-New button[value="Save"]')
#     page.click('modal-dialog modal-close .modal__close')
#     page.wait_for_selector(f'text="Version created successfully!"')
#     print(f"Version created successfully!!")

# def test_settings_algorithmTests(authenticated, project):
#     print("Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Test Algorithm Type
#     page.click('.heading-for-heading-for-Algorithm .Nav-action')
#     page.fill('#itemDivId-Algorithm-New text-input[name="Name"] input', 'New Algorithm')
#     page.fill('#itemDivId-Algorithm-New text-input[name="Description"] input', 'Algorithm description for automated test.')
#     page.click('#itemDivId-Algorithm-New button[value="Save"]')
#     page.wait_for_selector(f'text="/.*not valid for schema of type SchemaType.OBJECT: .*/"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"Algorithm endpoint hit successfully!!")

# def test_settings_attributeTests(authenticated, project):
#     print("Opening settings page...")
#     page = authenticated.new_page()
#     page.goto(f"/{project}/project-settings")
#     page.on("pageerror", print_page_error)

#     # Test Attribute Types
#     page.click('.heading-for-MediaType')
#     page.wait_for_selector('.SideNav-subItem a[text="My Image Type"]')
#     page.click('.SideNav-subItem a[text="My Image Type"]')
#     page.click('.item-box:not(.hidden) .add-new-in-form')
#     page.wait_for_selector('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog text-input[name="Name"] input', 'String Type')
#     page.select_option('modal-dialog enum-input[name="Data Type"] select', label='string')
#     page.fill('modal-dialog text-input[name="Description"] input', 'Attr description for automated test.')
#     page.click('modal-dialog input[type="submit"]')
#     page.wait_for_selector(f'text="New attribute type \'String Type\' added"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"New string type attribute added to Image!")

#     page.click('.heading-for-MediaType')
#     page.click('.item-box:not(.hidden) .add-new-in-form')
#     page.wait_for_selector('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog text-input[name="Name"] input', 'Int Type')
#     page.select_option('modal-dialog enum-input[name="Data Type"] select', label='int')
#     page.fill('modal-dialog text-input[name="Description"] input', 'Attr description for automated test.')
#     page.click('modal-dialog input[type="submit"]')
#     page.wait_for_selector(f'text="New attribute type \'Int Type\' added"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"New int type attribute added to Image!")

#     page.click('.heading-for-MediaType')
#     page.click('.item-box:not(.hidden) .add-new-in-form')
#     page.wait_for_selector('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog h2[text="New Attribute"]')
#     page.fill('modal-dialog text-input[name="Name"] input', 'Bool Type')
#     page.select_option('modal-dialog enum-input[name="Data Type"] select', label='bool')
#     page.fill('modal-dialog text-input[name="Description"] input', 'Attr description for automated test.')
#     page.click('modal-dialog input[type="submit"]')
#     page.wait_for_selector(f'text="New attribute type \'Bool Type\' added"')
#     page.click('modal-dialog modal-close .modal__close')
#     print(f"New bool type attribute added to Image!")


def test_settings_projectDelete(authenticated, project):
    print("Opening settings page...")
    page = authenticated.new_page()
    page.goto(f"/{project}/project-settings")
    page.on("pageerror", print_page_error)

    # WORKING -- commenting out bc not sure if this affects the rest of tests?
    print(f"Deleting project {project} via settings page...")
    page.click(f'a[href="#itemDivId-Project-{project}"]')
    page.click('project-main-edit .text-red button')
    page.wait_for_selector(f'text="Delete Confirmation"')
    page.click('button:has-text("Confirm")')
    page.wait_for_selector(f'text="Project {project} deleted successfully!"')
    print(f"Project deleted successfully!")