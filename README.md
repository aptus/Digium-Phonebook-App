FonB Digium Phonebook App
=============

To configure this app in your phone, you have to enable app development first by following instructions at [http://phones.digium.com/phone-api/how-to/content/enabling-app-development-mode](http://phones.digium.com/phone-api/how-to/content/enabling-app-development-mode). Once you have enabled app development, follow these steps:

1. Open config.js file and replace 10.0.8.6 with your host ip address
2. Create a zip archive containing all source files. You can do it by executing `zip app.zip *` command on linux terminal, inside directory that contains Digium app source files. From GUI, you might select all files and choose compress or archive from context menu.
3. Open http://your.digium.phone.ip/app_dev and login with admin account
4. Upload zip file you created in step 3 and save app settings.

You can access this app by navigating to menu/applications and selecting "Aptus FonB"