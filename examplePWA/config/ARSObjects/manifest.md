# ARS Objects to enable noiceARClient


## Groups
these groups must exist on the AR Server prior to importing forms and workflow

* 999001 - noicePWAUser

    add users to this group who will *use* the noiceARClient app

* 999002 - noicePWAAdmin

    add users to this group who will *manage* users of the noiceARClient app

## Forms
import from the included `./ARFormsAndWorkflow.def` file.

* noiceARClientForms

    lists forms and any custom noicePWA configuration data required to run them.

* noiceARClientUserProfile

    each user who successfully authenticates in the noiceARUser app and who has `noicePWAUser` permission, is automatically created an entry in this form (by deviceGUID + remedyLoginID). A member of `noicePWAAdmin` must grant permissions to entries in `nocieARClientForms` via this form.

* noiceARClientUserFormMapping

    this form maps users on `noiceARClientUserProfile` to entries in `noiceARClientForms`


## Demo Forms

* noice:demo:recipe
* noice:demo:recipe:ingredient
* noice:demo:ingredient

## Demo Menus

* noice:demo:ingredient:Name
