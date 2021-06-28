# Takauma (Flashback)

A web application where you can create an event and then create shareable link that anyone can use to upload photos for the event. This forms a flashback of some moment in time. Photos are stored in the user's own cloud service on google drive.

## About Google Drive and permissions

User signs in to the app with google credentials and allows the app permission to read users email, which is displayed in the app as information. User also allows the app permission to use users Google Drive. Photos are uploaded to users Google Drive in folders where the event is a folder.

The app sees and has access only folders and files created with the application. The app has no access to any other photos or files.

Signed user then creates new event, and where a folder is actually created to Google Drive by given event name.

#### Google service account

In the app, anyone who receives the link can upload photos to Google Drive without signing in. This behaviour is a challenge with google permissions. How to upload photos to users Google Drive. A signed-in user can upload photos to a folder so that they appear to the folder created by the user.

But, what about a situation where some unknown user wants to upload photos without signing in.

To do this, a service account has been created for the application to Google. Folders created by the application are given permission to the service account to allow the application to upload new files to the folders. By using the service account the application cannot view, download or edit any files other than inside the shared folders.

If the application were to be used in some business scenario, the service account could be configured to upload photos on behalf of a user, in which case this sharing would not need to be done. However, this cannot be done in this kind of public usable application for everyone.

The user creates events that are folders. User is the owner of the folders. The folder is assigned editing rights to the service account. The user then shares the event (folder in Drive) and creates a sharing link to upload the photos.

The link receivers open the application and upload some photos, the photos are created with the service account, so the service account is the owner of those photos in Google Drive.

Google does not permit transfer of ownership of files between users at different @domains. With this app, it is not possible to transfer ownership of the uploaded photo from the service account to the user who owns the folder.

Jakolinkin luonnissa lisäksi jaetaan kansio julkiseksi internetiin. Sovellus siis muuttaa tässäkin Google Drive kansion jako-oikeuksia. Huomiona siis, että kaikki linkin tietäjät pääsevät näkemään kuvat. Tämä on täsmälleen sama tapa, kuin jos Google Drivestä suoraan jakaa kansioon linkin. Osoite on sellainen, jota ei pysty arvaamaan.

When creating a share link, you also share the folder publicly on the Internet. the app changes the sharing permissions on the Google Drive folder. Note, everyone with the link will be able to see the photos. This is exactly same as if you share a link directly to a folder from Google Drive. The address is not easily guessable.

Kun kansio on jaettu internetiin, kuvia voi myös selata sovelluksessa täysikokoisina kuvina "kuvagalleriana". Tapahtumasta voi myöskin jakaa Google Drive kansion linkin suoraan, jolloin linkin saaja voi avata vaihtoehtoisesti Drive sovelluksella kansion.

Once a folder is shared on the Internet, photos can also be browsed in the app as full-size photos as an "image gallery". You can also share a link to the Google Drive folder directly, allowing the recipient of the link to open the folder alternatively with the Drive app.
