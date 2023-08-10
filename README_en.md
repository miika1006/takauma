# Takauma (Flashback)

A web application where you can create an event and then create shareable link that anyone can use to upload photos for the event. This forms a flashback of some moment in time. Photos are stored in the user's own cloud service on google drive.

## About Google Drive and permissions

User signs in to the app with google credentials and allows the app permission to read users email, which is displayed in the app as information. User also allows the app permission to use users Google Drive. Photos are uploaded to users Google Drive in folders where the event is a folder.

The app sees and has access only folders and files created with the application. The app has no access to any other photos or files.

Signed user then creates new event, and where a folder is actually created to Google Drive by given event name.

In the app, anyone who receives the link can upload photos to Google Drive without signing in. This behaviour is a challenge with google permissions. How to upload photos to users Google Drive. A signed-in user can upload photos to a folder so that they appear to the folder created by the user.

But, what about a situation where some unknown user wants to upload photos without signing in.

To make this happen, the users refresh token is saved to database. When someone uploads a photo with the app, the refresh token is used in google upload requests.

If the application were to be used in some business scenario, a service account could be configured to upload photos on behalf of a user. However, this cannot be done in this kind of public usable application for everyone.

The user creates events that are folders. User is the owner of the folders. The user then shares the event (folder in Drive) and creates a sharing link to upload the photos.

The link receivers open the application and upload some photos, the photos are created into the users Google Drive Folder.

Google does not permit transfer of ownership of files between users at different @domains. With this app, it is not possible to transfer ownership of the uploaded photo.

When creating a share link, you also share the folder publicly on the Internet. the app changes the sharing permissions on the Google Drive folder. Note, everyone with the link will be able to see the photos. This is exactly same as if you share a link directly to a folder from Google Drive. The address is not easily guessable.

Once a folder is shared on the Internet, photos can also be browsed in the app as full-size photos as an "image gallery". You can also share a link to the Google Drive folder directly, allowing the recipient of the link to open the folder alternatively with the Drive app.
