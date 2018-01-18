const iframe = document.getElementById('playerFrame');
const baseUrl = "https://riipen.mediacore.tv";
const apiUrl = baseUrl + "/api2/media";
const username = "riipenchallenge@mediacore.com";
const password = "riipenchallenge";
const nothingToPlayImg = "images/NotFoundImage.png";

var playlist = [];
var currentItemIndex = 0;

class PlayItem {
    constructor(id, title, description, url) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.url = url;
    }
}

$(document).ready(function () {
    main();

    $('#previousBtn').click(function () {
        if (currentItemIndex - 1 > -1) {
            currentItemIndex -= 1;
            PlayItems();
        }
    });

    $('#nextBtn').click(function () {
        if (currentItemIndex + 1 < playlist.length) {
            currentItemIndex += 1;
            PlayItems();
        }
    });

});

function main() {
    GeneratePlaylist();

    PlayItems();
}

function GeneratePlaylist() {
    // Gets media items from API
    var mediaItems = GetMediaItems();

    // Get all the related embed codes for items returned above
    for (var i = 0; i < mediaItems.count; i++) {
        var embedCodeResponse = GetEmbedCode(mediaItems.items[i].id);

        // Generate a playlist object
        var tempPlayItem = new PlayItem(
            id = mediaItems.items[i].id,
            title = mediaItems.items[i].title,
            description = mediaItems.items[i].description_plain,
            url = embedCodeResponse.url
        );

        // Cache playlist items
        playlist.push(tempPlayItem);
    }
}

function PlayItems() {
    if (currentItemIndex >= playlist.length || currentItemIndex < 0) {
        currentItemIndex = 0; // This should not ever happen but just in case.
    }

    ToggleButtons();

    if (playlist.length == 0) {
        iframe.src = nothingToPlayImg;

        return;
    }

    var currentItem = playlist[currentItemIndex];
    iframe.src = currentItem.url; // Can optionally query the api here to see if video still exists.
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
            PlayItems();
        }
    });
}

function ToggleButtons() {
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

function GetMediaItems() {
    var response = PerformApiCall("?type=video");

    return response;
}

function GetEmbedCode(mediaId) {
    var response = PerformApiCall("/" + mediaId + "/embedcode");

    return response;
}

function PerformApiCall(endpoint) {
    var jqxhr = $.ajax({
        url: apiUrl + endpoint,
        type: "GET",
        async: false,
        dataType: "JSON",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
        }
    });

    return jqxhr.responseJSON;
}