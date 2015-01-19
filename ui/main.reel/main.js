/**
 * @module ui/main.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

OWF.relayFile = '../assets/js/eventing/rpc_relay.uncompressed.html';

var logger;
var appender;

// message variables
var widgetPayloadSpan 		= "";
var errorMessage 					= "";
var widgetNameLaunched 		= "";
var widgetChannel 				= "";
var launchResultsMessage 	= "";

var widgetToLaunch;

// launch variables
var data = {};
var cmapi_channel;
var cmapi_message;
var bookmarkLaunchType = "";

// widget names used for the GUID lookup
var widgetOne = "MSMV";
var widgetTwo = "MSMV Trunk";

// default launch bookmark 
var bookmarkIdPayload = { "bookmarkId": 9853 };
var bookmarkUrlPayload = { "bookmarkUrl": "http://local.msmv.pdc.org:8080/msmvng/msmvng/?bookmark=9853" };

// default bookmarks for channel commands
var channelBookmarkIdPayload = { "bookmarkId": 9944 }; // good location to test filter toggle
var channelBookmarkUrlPayload = { "bookmarkUrl": "http://local.msmv.pdc.org:8080/msmvng/msmvng/?bookmark=9886" };

// default overlay url
var overlayUrl = "http://plu.sx/kml/1.kml";
// var overlayUrl = "plu.sx/kml/1.kml";

/ initial data value for launch channel and payload - default setting
data = {
    channel: "org.pdc.bookmark.load",
    payload: bookmarkIdPayload
};


// Search for the GUID corresponding to the 'widgetToLaunch' name
// if successful call the launchSecondTracker function
var lookupSecondTracker = function() {
    console.log("inside lookupSecondTracker");
    var searchConfig = {
        searchParams:  { widgetName: widgetToLaunch }, 
        onSuccess: launchSecondTracker, 
        onFailure: failWidgetLookupError
    };
    logger.debug('Looking up:'+searchConfig.searchParams.widgetName);
    console.log('Looking up:'+searchConfig.searchParams.widgetName);

    OWF.Preferences.findWidgets(searchConfig);
};

// Launch the widget based on the found GUID
// on success callback from lookupSecondTracker function
var launchSecondTracker = function  (findResultsResponseJSON) {
    console.log("inside launchSecondTracker");
    logger.debug('Search result:'+ findResultsResponseJSON);
    console.log('Search result:'+ findResultsResponseJSON);
    if(findResultsResponseJSON.length == 0) {
        // Did not find Widget
        failWidgetLookupError("Widget was not found in user profile.  User may not have access.");
    }
    else {
        var guidOfWidgetToLaunch = findResultsResponseJSON[0].path;
        logger.debug('Search result [GUID]:'+ guidOfWidgetToLaunch);

        // data is set in jQuery          
        var dataString = OWF.Util.toString(data);

        OWF.Launcher.launch(
            {
                guid: guidOfWidgetToLaunch,  // The retrieved GUID of the widget to launch
                launchOnlyIfClosed: true, // If true will only launch the widget if it is not already opened.
                data: dataString  // Initial launch config data to be passed to 
                //   a widget only if the widget is opened.  This must be a string!
            }, 
            callbackOnLaunch
        );
    }
}

// Display an error when a widget cannot be located
var failWidgetLookupError= function (widgetLookupErrorMessage) {
    errorMessage = "Launch Failure: [" + widgetToLaunch +"]: " + widgetLookupErrorMessage;
    console.lot(errorMessage);
}

// Widget Launching callback function indicating success or failure
function callbackOnLaunch (resultJson) {

    if(resultJson.error) {
        // if there was an error, print that out on the launching widget
        launchResultsMessage += ("Launch Error:" + resultJson.message);
    }

    if(resultJson.newWidgetLaunched) {
        // if the new widget was launched, say so
        widgetNameLaunched =  "Widget Launched: " + widgetToLaunch;
        widgetChannel = "Channel: " + data.channel;
        launchResultsMessage = "Unique id of Widget Launched: " + resultJson.uniqueId;
    }
    else {
        // if the new widget was not launched, say so and explain why not
        launchResultsMessage = ("Launch Error: " + resultJson.message  + 
                                " Widget exists already with id: " + resultJson.uniqueId);               
    }
   console.log(widgetNameLaunched);
   console.log("Payload: " + JSON.stringify(data.payload));
   console.log(widgetChannel);
   console.log(launchResultsMessage);
}

function logInit() {

    //logger = OWF.Log.getLogger('DynamicLauncher');
    logger = OWF.Log.getDefaultLogger();
    OWF.Log.setEnabled(true);

    appender = logger.getEffectiveAppenders()[0];
    appender.setThreshold(log4javascript.Level.DEBUG);
}

function onSetFailure(error,status){
    OWF.Util.ErrorDlg.show("Got an error updating preferences! Status Code: " + status + " . Error message: " + error);
};

function initPrefs() {
    OWF.Preferences.getUserPreference(
        {namespace:'com.mycompany.AnnouncingClock', 
         onSuccess:function(){
             console.log('great success');
         }, 
         onFailure:onGetFailure});
}

function onGetFailure(error,status) {
    if (status != 404) {
        OWF.Util.ErrorDlg.show("Got an error getting preferences! Status Code: " + status + " . Error message: " + error);
    }
}

function initPage() { 
    logInit();
    initPrefs();
    console.log('Running in OWF: ' + (OWF.Util.isRunningInOWF()?"Yes":"No"));
    //$isRunning.empty().append('Running in OWF: ' + (OWF.Util.isRunningInOWF()?"Yes":"No"));
}

owfdojo.addOnLoad(function() {
    OWF.ready(initPage);
});


/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();
        }
    },

    handleLaunchMeAction: {
        value: function (event) {
            console.log("Launch Me clicked - calling lookupSecondTracker");
            lookupSecondTracker();
        }
    }

});
