const iframe = document.getElementById('playerFrame');
const baseUrl = "https://riipen.mediacore.tv";
const apiUrl = baseUrl + "/api2/media";
const basicAuth = "cmlpcGVuY2hhbGxlbmdlQG1lZGlhY29yZS5jb206cmlpcGVuY2hhbGxlbmdl"; // Ideally should use OAuth 2 and not have this string saved here!
const nothingToPlayImg = "images/NotFoundImage.png";

var playlist = [];  // List of all the videos returned by API
var currentItemIndex = 0;  // Index of currently played video

// Setup object blueprint to store in playlist
class MediaItem {
    constructor(id, title, description, url) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.url = url;
    }
}

// Entry point
$(document).ready(function () {
    generatePlaylist();

    // Start playing
    playItems();

    // Bind buttons

    $('#previousBtn').click(function () {
        if (currentItemIndex - 1 > -1) {
            currentItemIndex -= 1;
            playItems();
        }
    });

    $('#nextBtn').click(function () {
        if (currentItemIndex + 1 < playlist.length) {
            currentItemIndex += 1;
            playItems();
        }
    });

});

// Pull required data from API and build a playlist
function generatePlaylist() {
    // Gets media items from API
    var mediaItems = getMediaItems();

    // Get all the related embed codes for items returned above
    for (var i = 0; i < mediaItems.count; i++) {

        if (!mediaItems.items[i].hasOwnProperty('id')) {  // Check if object is roughly the one we expect

            continue; // Always leave a line before continue, return, or break statements (personal coding style)
        }

        var embedCodeResponse = getEmbedCode(mediaItems.items[i].id);

        if (!embedCodeResponse.hasOwnProperty('url')) {  // Check if object is roughly the one we expect

            continue;
        }

        // Generate a playlist object
        var tempPlayItem = new MediaItem(
            id = mediaItems.items[i].id,
            title = mediaItems.items[i].title,
            description = mediaItems.items[i].description_plain,
            url = embedCodeResponse.url
        );

        // Cache playlist items
        // Note: assumption is made that it is okay to cache items returned from API for this assignment. 
        // This would not be a good idea if there are too many items (memory spike) or if content on API changes very frequently (sync issues).
        playlist.push(tempPlayItem);  
    }
}

// Handles playback. 
// If there is nothing to play, loads an appropriate image to display a message.
// Play all items in playlist in a non-stop mode.
// When invoked starts playing from currentItemIndex which is 0 by default.
// Does nothing once it reaches the end of the playlist
function playItems() {
    if (currentItemIndex >= playlist.length || currentItemIndex < 0) {
        currentItemIndex = 0; // This should not ever happen but just in case.
    }

    toggleButtons();

    if (playlist.length == 0) {
        iframe.src = nothingToPlayImg;

        return;
    }

    var currentItem = playlist[currentItemIndex];
    iframe.src = currentItem.url; // Can optionally query the API here to see if video still exists. This is not a requirement for this assignment.
    $('#title').text(currentItem.title);
    $('#description').text(currentItem.description);

    const player = new playerjs.Player(iframe);

    // Autoplay the video when it's ready.
    player.on('ready', function () {
        player.play();
    });

    // Play next item when current one ends.
    player.on('ended', function () {
        if (currentItemIndex + 1 < playlist.length) {
            currentItemIndex += 1;

            playItems(); // Recurse to cause next video to play
        }
    });
}

// Enable or disable buttons as appropriate for UX
function toggleButtons() {
    if (currentItemIndex == 0) {
        $('#previousBtn').prop('disabled', true);
    }
    else if (currentItemIndex > 0) {
        $('#previousBtn').prop('disabled', false);
    }

    if (currentItemIndex == playlist.length - 1) {
        $('#nextBtn').prop('disabled', true);
    }
    else if (currentItemIndex < playlist.length - 1) {
        $('#nextBtn').prop('disabled', false);
    }
}

function getMediaItems() {
    var response = performApiCall("?type=video"); // Note: response var can be avoided but it makes debugging easy (personal coding style).

    return response;
}

function getEmbedCode(mediaId) {
    var response = performApiCall("/" + mediaId + "/embedcode");

    return response;
}

function performApiCall(endpoint) {
    var jqxhr = $.ajax({
        url: apiUrl + endpoint,
        type: "GET",
        async: false,
        dataType: "JSON",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + basicAuth);
        }
    });

    // Nice-to-have a generic error reponse handler. But for now this is handled by the caller by using hasOwnProperty to check if response object is the one we expect.

    return jqxhr.responseJSON;
}