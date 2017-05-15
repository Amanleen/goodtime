
    // Client ID and API key from the Developer Console
      var CLIENT_ID = '13207305213-v5jrkaoe6spd590qq5sjc5p3j34ecru3.apps.googleusercontent.com';

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

      var authorizeButton = document.getElementById('authorize-button');
      var signoutButton = document.getElementById('signout-button');

      /**
       *  On load, called to load the auth2 library and API client library.
       */
      function handleClientLoad() {
        gapi.load('client:auth2', initClient);
      }
      /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */
      function initClient() {
        gapi.client.init({
          discoveryDocs: DISCOVERY_DOCS,
          clientId: CLIENT_ID,
          scope: SCOPES
        }).then(function (gu) {
          console.log("google user", gu);
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          authorizeButton.onclick = handleAuthClick;
          signoutButton.onclick = handleSignoutClick;
        });
      }

      /**
       *  Called when the signed in status changes, to update the UI
       *  appropriately. After a sign-in, the API is called.
       */
      function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
          authorizeButton.style.display = 'none';
          signoutButton.style.display = 'block';
          listUpcomingEvents();
        } else {
          authorizeButton.style.display = 'block';
          signoutButton.style.display = 'none';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
      }

      /**
       * Append a pre element to the body containing the given message
       * as its text node. Used to display the results of the API call.
       *
       * @param {string} message Text to be placed in pre element.
       */
      function appendPre(message) {
        var pre = document.getElementById('content');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);
      }

      /**
       * Print the summary and start datetime/date of the next ten events in
       * the authorized user's calendar. If no events are found an
       * appropriate message is printed.
       */
      function listUpcomingEvents() {
        var auth = gapi.auth2.getAuthInstance().currentUser['Ab']['Zi']['access_token'];
        var authEmail = gapi.auth2.getAuthInstance().currentUser['Ab']['w3']['U3'];
        // var arrayOfReminders;
        
        // console.log("auth", auth);
        // console.log("authEmail", authEmail);
        $.ajax({
          type: "GET",
          url : "/get_events",
          data : {authorized:auth, email:authEmail}
        }).done(function(data, status,callback) {
          if(status==='success'){
            // var info = JSON.parse(data);
            var cacheforreminderObj = data;
            // console.log("cacheforreminderObj " + cacheforreminderObj);
            var reminders = cacheforreminderObj.listOfReminders;
            if(reminders.length>0){
                appendPre('Upcoming events:'+reminders.length);
                for (i = 0; i < reminders.length; i++) {
                  var finalString = "\n Title:"+reminders[i].title + " at "+reminders[i].when+"\n Description:"+reminders[i].description+" attendees:";
                  var attendeeListArray = reminders[i].listofAtendees;
                  if(attendeeListArray!=null){
                      for(var j=0; j<attendeeListArray.length;j++ ){
                      finalString = finalString+" \n Attendee:"+attendeeListArray[j].displayName+", "+attendeeListArray[j].responseStatus
                     }
                  }
                  appendPre(finalString);
                }
              }
            } else {
              arrayOfReminders = new Array(0);
              appendPre('No upcoming events found.');
            }
        });
      }
 