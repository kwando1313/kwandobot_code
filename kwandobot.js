var Discord = require("discord.js");

var mybot = new Discord.Client({
    autoReconnect: true
});

var express = require('express');
var request = require('request');
var async = require('async');

var fs = require("fs");
var ytdl = require('ytdl-core');
var auth = require('./config');
var base64 = require('node-base64-image');
var GoogleSpreadsheet = require('google-spreadsheet');
var userDoc = new GoogleSpreadsheet('1YAQ1MjM14sKrrg7O2VkQyR0HO3l4V411mEtypp9fLVg');
var imageDoc = new GoogleSpreadsheet('1MKd-JrpuDxD3nz6foGQNpmqMhJGDqO1Z8r9zg8a_mzA');
var googleCreds = require('./googledrive');

var keepTrying = false;
var logged_off = true;


var cards = ["A♠", "2♠", "3♠", "4♠", "5♠", "6♠", "7♠", "8♠", "9♠", "10♠", "J♠", "Q♠", "K♠", "A♥", "2♥", "3♥", "4♥", "5♥", "6♥", "7♥", "8♥", "9♥", "10♥", "J♥", "Q♥", "K♥", "A♦", "2♦", "3♦", "4♦", "5♦", "6♦", "7♦", "8♦", "9♦", "10♦", "J♦", "Q♦", "K♦", "A♣", "2♣", "3♣", "4♣", "5♣", "6♣", "7♣", "8♣", "9♣", "10♣", "J♣", "Q♣", "K♣"];
var ignore_olol = false;
var youtube_links = [];

var tabulaRecta = {
    a: "abcdefghijklmnopqrstuvwxyz",
    b: "bcdefghijklmnopqrstuvwxyza",
    c: "cdefghijklmnopqrstuvwxyzab",
    d: "defghijklmnopqrstuvwxyzabc",
    e: "efghijklmnopqrstuvwxyzabcd",
    f: "fghijklmnopqrstuvwxyzabcde",
    g: "ghijklmnopqrstuvwxyzabcdef",
    h: "hijklmnopqrstuvwxyzabcdefg",
    i: "ijklmnopqrstuvwxyzabcdefgh",
    j: "jklmnopqrstuvwxyzabcdefghi",
    k: "klmnopqrstuvwxyzabcdefghij",
    l: "lmnopqrstuvwxyzabcdefghijk",
    m: "mnopqrstuvwxyzabcdefghijkl",
    n: "nopqrstuvwxyzabcdefghijklm",
    o: "opqrstuvwxyzabcdefghijklmn",
    p: "pqrstuvwxyzabcdefghijklmno",
    q: "qrstuvwxyzabcdefghijklmnop",
    r: "rstuvwxyzabcdefghijklmnopq",
    s: "stuvwxyzabcdefghijklmnopqr",
    t: "tuvwxyzabcdefghijklmnopqrs",
    u: "uvwxyzabcdefghijklmnopqrst",
    v: "vwxyzabcdefghijklmnopqrstu",
    w: "wxyzabcdefghijklmnopqrstuv",
    x: "xyzabcdefghijklmnopqrstuvw",
    y: "yzabcdefghijklmnopqrstuvwx",
    z: "zabcdefghijklmnopqrstuvwxy",
    A: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    B: "BCDEFGHIJKLMNOPQRSTUVWXYZA",
    C: "CDEFGHIJKLMNOPQRSTUVWXYZAB",
    D: "DEFGHIJKLMNOPQRSTUVWXYZABC",
    E: "EFGHIJKLMNOPQRSTUVWXYZABCD",
    F: "FGHIJKLMNOPQRSTUVWXYZABCDE",
    G: "GHIJKLMNOPQRSTUVWXYZABCDEF",
    H: "HIJKLMNOPQRSTUVWXYZABCDEFG",
    I: "IJKLMNOPQRSTUVWXYZABCDEFGH",
    J: "JKLMNOPQRSTUVWXYZABCDEFGHI",
    K: "KLMNOPQRSTUVWXYZABCDEFGHIJ",
    L: "LMNOPQRSTUVWXYZABCDEFGHIJK",
    M: "MNOPQRSTUVWXYZABCDEFGHIJKL",
    N: "NOPQRSTUVWXYZABCDEFGHIJKLM",
    O: "OPQRSTUVWXYZABCDEFGHIJKLMN",
    P: "PQRSTUVWXYZABCDEFGHIJKLMNO",
    Q: "QRSTUVWXYZABCDEFGHIJKLMNOP",
    R: "RSTUVWXYZABCDEFGHIJKLMNOPQ",
    S: "STUVWXYZABCDEFGHIJKLMNOPQR",
    T: "TUVWXYZABCDEFGHIJKLMNOPQRS",
    U: "UVWXYZABCDEFGHIJKLMNOPQRST",
    V: "VWXYZABCDEFGHIJKLMNOPQRSTU",
    W: "WXYZABCDEFGHIJKLMNOPQRSTUV",
    X: "XYZABCDEFGHIJKLMNOPQRSTUVW",
    Y: "YZABCDEFGHIJKLMNOPQRSTUVWX",
    Z: "ZABCDEFGHIJKLMNOPQRSTUVWXY"
};

function encrypt(plainText, keyword) {
    var encryptedText = "";
    var specialCharacterCount = 0;

    for (var i = 0; i < plainText.length; i++) {
        var keyLetter = (i - specialCharacterCount) % keyword.length;
        var keywordIndex = tabulaRecta.a.indexOf(keyword[keyLetter]);

        if (tabulaRecta[plainText[i]]) {
            encryptedText += tabulaRecta[plainText[i]][keywordIndex];
        } else {
            encryptedText += plainText[i];
            specialCharacterCount++;
        }
    }

    return encryptedText;
}

function decrypt(encryptedText, keyword) {

    var decryptedText = "";
    var specialCharacterCount = 0;

    for (var i = 0; i < encryptedText.length; i++) {
        var keyLetter = (i - specialCharacterCount) % keyword.length;
        var keyRow = tabulaRecta[keyword[keyLetter]];

        if (keyRow.indexOf(encryptedText[i]) !== -1) {
            decryptedText += tabulaRecta.a[keyRow.indexOf(encryptedText[i])];
        } else {
            keyRow = tabulaRecta[keyword[keyLetter].toUpperCase()];
            if (keyRow.indexOf(encryptedText[i]) !== -1) {
                decryptedText += tabulaRecta.a[keyRow.indexOf(encryptedText[i])].toUpperCase();
            } else {
                decryptedText += encryptedText[i];
                specialCharacterCount++;
            }
        }
    }

    return decryptedText;
}

//mybot.on("debug", console.log);

mybot.on("message", function(message) {

    var server = message.channel.guild;
    var channel = message.channel;
	try{
		
		if (server && server.available && server.id && server.id == "137392287108825088" && message.member.highestRole && message.member.highestRole.id == server.id) {
			if (message.content.indexOf("discord.gg") != -1) {
				message.delete();
			}
			return;
		}
	}
	catch(e){
		console.log(e);
	}
    var vita_attacks = ["Giganthammer!", "Gigantschlag!", "Kometfliegen!", "Raketenhammer!", "Schwalbefliegen!", "Zerstörungshammer!"];
    var erika_quotes = ["<Very good. Once more.>", "<Good.>", "<What do you think, everyone?>", "Simply by the existence of this Discord, this level of reasoning is possible for Furudo Erika!", "I, Furudo Erika, have duct tape!", "I love chopsticks. With a pair of chopsticks, I can eat absolutely any dish!"];
    var osu_plays = ["https://www.youtube.com/watch?v=rpwJSc2CdL4", "https://www.youtube.com/watch?v=_VrkG_CAI1E", "https://www.youtube.com/watch?v=ErarSo-ZJnA", "https://www.youtube.com/watch?v=aXCqIwTK828", "https://www.youtube.com/watch?v=G8nivT48W_U", "https://www.youtube.com/watch?v=rHRbibbbXGE", "https://www.youtube.com/watch?v=tkQP5COnPuo", "https://www.youtube.com/watch?v=ZgIfu930jKg", "https://www.youtube.com/watch?v=Ebz97XwpNcI", "https://www.youtube.com/watch?v=mMf6nyyJI5c", "https://www.youtube.com/watch?v=XpcbEH5jwqQ", "https://www.youtube.com/watch?v=5d432cQoT-c", "https://www.youtube.com/watch?v=K76LL-jr4WQ", "https://www.youtube.com/watch?v=8T9sVPvaCYU", "https://www.youtube.com/watch?v=82v5FkkqgyQ", "https://www.youtube.com/watch?v=uUnz8NCNrgo", "https://www.youtube.com/watch?v=qdaZnQQAPqQ", "https://www.youtube.com/watch?v=pRagiT78NsY", "https://www.youtube.com/watch?v=oXb72w5_AYU", "https://www.youtube.com/watch?v=w0HbBskgETM", "https://www.youtube.com/watch?v=w_SWxr8xFiI"];
    var sentMessage = message.content.toLowerCase();
    var ships = ["Titanic", "Mayflower", "Andrea Doria", "Argo", "HMS Beagle", "Bismarck", "Bluenose", "HMS Bounty", "Carpathia", "Discovery", "HMS Dreadnought", "HMS Endeavour", "Endurance", "USS Enterprise", "Essex", "RMS Lusitania", "USS Missouri", "La Pinta", "Potemkin", "Queen Anne's Revenge", "HMS Queen Elizabeth", "Santa Maria", "Tek Sing", "Vasa", "HMS Victory", "Yamato"]

    var camilla_quotes = ["Oh, AVATAR. Why are you so cute?! I want to hug you and never let go!",
        "Oh, how I envy all the time you've spent with my dear AVATAR...",
        "Oh, AVATAR... I'm so dreadfully bored. Won't you entertain me?",
        "There's no one I'd rather spend my days with, AVATAR...",
        "Oh, I was just looking for you. Have time for a li'l chat?",
        "Ah, dearest AVATAR. I hope you're having a wonderful day.",
        "Just tell me who I need to kill to make you happy, sweetie.",
        "Welcome to the armory, darling. Are you looking for something sharp and shiny?",
        "Aw, you're so sweet to get me a gift like this.",
        "I helped with the rice harvest, but my mind wasn't on my work. It was fixed upon you...",
        "You're so cute---putting up such a good fight over this! Normally, I'd never go on a trip without my dear AVATAR. But my retainers begged and begged and begged... They really want me to go. And who am I to deny them?",
        "Thanks to you, my darling AVATAR didn't sleep a wink and neither did I! Now I am in a MOOD, so forgive me if I make this hurt.",
        "Mm-mmm. Those weapons look divine. I think I'll take one for myself. Oh, but why stop at one, when I could take them from you all? Teehee!",
        "Do you want the usual, darling? I know just how you like it...",
        "Ooh! There are things here that would look simply stunning on you!",
        "Poor thing! You deserved better. "
    ]
    //Kwando pls
    if (sentMessage === "!pika") {
        if (is_sender_mod(message) || is_sender_admin(message))
            channel.sendMessage("chu~").catch(console.error);
        else if (message.author.id === "134288164129865728") {
            channel.sendMessage("chu~~~").catch(console.error);
        }
    }

    if (sentMessage === "!camilla") {
        var randomNumber = Math.floor((Math.random() * camilla_quotes.length));
        var quote = camilla_quotes[randomNumber].replace("AVATAR", message.author.name);
        channel.sendMessage(quote).catch(console.error);
    }

    if (sentMessage === "!tan") {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            channel.sendMessage("tei~").catch(console.error);
        }
    }

    if (sentMessage === "!donate") {
        channel.sendMessage("If you want to help donate to the server costs for hosting the bot, please donate here: https://twitch.streamlabs.com/kwando1313").catch(console.error);
    }

    if (sentMessage.indexOf("!setgame") == 0) {
        if (message.author.id == "124712527975284736") {
            var parameter = message.content.replace("!setgame", "").replace(" ", "");
            console.log(parameter);
            if (parameter == "") {
                mybot.user.setGame("Love Live").catch(console.error);
            } else {
                mybot.user.setGame(parameter).catch(console.error);
            }
        }
    }

    if (sentMessage.indexOf("!uptime") == 0) {
        var uptime = mybot.uptime;
        var uptime_string = millisecondsToStr(uptime);
        channel.sendMessage("Uptime is" + uptime_string).catch(console.error);
    }

    if (sentMessage.indexOf("!serverinfo") == 0) {
        if (message.author.id == "124712527975284736") {
            var roles = "";
            var roles_array = message.guild.roles.array()
            //console.log(roles_array);
            for (var x = 0; x < roles_array.length; x++) {
                roles += (roles_array[x].name + " (" + roles_array[x].id + ")\n");
            }
            channel.sendMessage("```Server Name: " + message.guild.name + "\nRoles:\n" + roles + "Member Count: " + message.guild.memberCount + "\nCreated At: " + message.guild.createdAt + "\nVoice Region: " + message.guild.region + "```").catch(console.error);
        }
    }


    //Eirika colour: 37A5AD
    if (sentMessage.indexOf("!avatar") == 0) {
        if (message.author.id == "124712527975284736") {
            if (message.mentions && message.mentions.users && message.mentions.users.first() != null) {
                channel.sendMessage(message.mentions.users.first().avatarURL).catch(console.error);
            } else {
                var regex = /(\d{17,20})/ig;
                var id = message.content.match(regex)[0];
                var user = server.member(id);
                channel.sendMessage(user.user.avatarURL).catch(console.error);
            }
        }
    }

    if (sentMessage.indexOf("!setnickname") == 0) {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            var id = "";
            if (message.mentions && message.mentions.users && message.mentions.users.first() != null) {
                id = message.mentions.users.first();
            } else {
                var regex = /(\d{17,20})/ig;
                id = message.content.match(regex)[0];
            }
            if (id != "") {
                var user = server.member(id);
                if (user) {
                    var name = message.content.substring(message.content.indexOf(id) + id.length, message.content.length);
                    channel.sendMessage(user.setNickname(name)).catch(console.error);
                } else {
                    channel.sendMessage("User not in server.").catch(console.error);
                }
            }
        }

    }




    if (sentMessage.indexOf("!userinfo") == 0) {
        try {
            var embed = new Discord.RichEmbed();
            var id = "";
            console.log(message.mentions);
            if (message.mentions && message.mentions.users && message.mentions.users.first() != null) {
                id = message.mentions.users.first();
            } else {
                var regex = /(\d{17,20})/ig;
                id = message.content.match(regex)[0];

            }
            if (id != "") {
                var user = server.member(id);
                if (user) {
                    var roles = "";
                    var roles_array = user.roles.array()
                    //console.log(roles_array);
                    for (var x = 1; x < roles_array.length - 1; x++) {
                        roles += (roles_array[x].name + ", ");
                    }
                    roles += roles_array[roles_array.length - 1].name;
                    embed.setThumbnail(user.user.avatarURL);
                    embed.addField("Username", user.user.username);
                    if (user.user.username != user.displayName) {
                        embed.addField("Nickname", user.displayName);
                    }
                    embed.addField("Joined Server", user.joinedAt);
                    embed.addField("Joined Discord", user.user.createdAt);
                    embed.addField("Roles", roles);
                    embed.setColor(0x37A5AD);
                    channel.sendEmbed(embed).catch(console.error);

                } else {
                    channel.sendMessage("User not in server.").catch(console.error);
                }
            }
        } catch (err) {
            console.error(err);
        }

    }


    if (sentMessage.indexOf("!say") == 0 && sentMessage.indexOf("!saymain") < 0 && sentMessage.indexOf("!saychannel") < 0) {
        if (message.author.id == "124712527975284736") {
            var parameter = message.content.replace("!say ", "");
            channel.sendMessage(parameter).catch(console.error);
            message.delete();
        }
    }

    if (sentMessage.indexOf("!miku") == 0) {
        channel.sendMessage("Miku~").catch(console.error);
    }

    if (sentMessage === "!vita") {
        var randomNumber = Math.floor((Math.random() * vita_attacks.length));
        channel.sendMessage(vita_attacks[randomNumber]).catch(console.error);
    }

    if (sentMessage === "!tsundere") {
        message.reply("I-It's not like I like you or a-anything... b-baka!").catch(console.error);
    }

    if (sentMessage === "!kyubey" || sentMessage === "!qb") {
        channel.sendMessage("／人◕ ‿‿ ◕人＼ Make a contract with me and become a magical girl! ／人◕ ‿‿ ◕人＼ ").catch(console.error);
    }

    if (sentMessage.indexOf("!hnng") == 0) {
        message.reply("Moe~").catch(console.error);
    }

    if (sentMessage === "!ship") {
        var randomNumber = Math.floor((Math.random() * ships.length));
        channel.sendMessage(ships[randomNumber] + ".").catch(console.error);
    }

    if (message.author.id == "124712527975284736") {
        if (sentMessage === "!logout") {
            mybot.logout();
        }
    }

    if (sentMessage.indexOf("!achange") == 0) {
        if (message.author.id == "124712527975284736") {
            var image_link = sentMessage.replace("!achange ", "");

            if (image_link.length > 0) {
                var options = {
                    string: true
                };

                base64.base64encoder(image_link, options, function(err, image) {
                    if (err) {
                        console.log(err);
                        message.reply("Error!");
                    }
                    message.reply("Changed image").catch(console.error);
                    mybot.user.setAvatar("data:image/png;base64," + image);
                });

            }
        }
    }

    if (sentMessage.indexOf("!nchange") == 0) {
        if (message.author.id == "124712527975284736") {
            var parameter = message.content.replace("!nchange ", "");
            mybot.user.setUsername(parameter).catch(console.error);
        }
    }

    if (sentMessage.indexOf("!erika") == 0) {
        var randomNumber = Math.floor((Math.random() * erika_quotes.length));
        channel.sendMessage(erika_quotes[randomNumber]).catch(console.error);
    }

    if (sentMessage.indexOf("!op") == 0 || sentMessage.indexOf("!ed") == 0) {
        channel.sendMessage("http://openings.moe").catch(console.error);
    }

    if (sentMessage.indexOf("!betatestdwamcase") == 0) {
        channel.sendMessage("Needs more crack.").catch(console.error);
    }

    //you're so silly

    //Actually useful functions

    if (sentMessage.indexOf("!addimage") == 0) {
        if (message.author.id === "124712527975284736") {
            var contentArray = message.content.split(" ");
            var word = contentArray[1];
            var lowercaseWord = word.toLowerCase();
            var imageLink = contentArray[2];
            async.series([
                function doAuth(step) {
                    imageDoc.useServiceAccountAuth(googleCreds, step);
                },
                function doRegister(step) {
                    imageDoc.getRows(1, {
                        query: "word = " + lowercaseWord
                    }, function(error, rows) {
                        if (error) {
                            channel.sendMessage("ERROR: " + error);
                        } else if (rows != null && rows[0]) {
                            if (rows[0].hasOwnProperty('word')) {
                                channel.sendMessage("Image already in me.").catch(console.error);
                            }
                        } else {
                            imageDoc.addRow(1, {
                                "word": lowercaseWord,
                                "link": imageLink
                            }, function(err) {
                                if (err) {
                                    console.log(err);
                                    channel.sendMessage("Error in inserting image in.").catch(console.error);
                                } else {
                                    channel.sendMessage("Successfully added in the image.").catch(console.error);
                                }
                            });
                        }
                    });
                }
            ]);
        }
    }

    if (sentMessage.indexOf("!listimages") == 0) {
        channel.sendMessage("You can find a list of all the images you can send here: https://docs.google.com/spreadsheets/d/1MKd-JrpuDxD3nz6foGQNpmqMhJGDqO1Z8r9zg8a_mzA/edit?usp=sharing").catch(console.error);
    }

    if (sentMessage.indexOf("!image") == 0) {
        var contentArray = sentMessage.split(" ");
        var word = contentArray[1];
        async.series([
            function doAuth(step) {
                imageDoc.useServiceAccountAuth(googleCreds, step);
            },
            function doImage(step) {
                var imageLink = null;
                imageDoc.getRows(1, {
                    query: "word = " + word
                }, function(error, rows) {
                    if (error) {
                        console.log(error);
                    } else if (rows != null && rows[0]) {
                        if (rows[0].hasOwnProperty('word')) {
                            imageLink = rows[0].link;
                            send_image(channel, imageLink, "");
                        }
                    }
                });
            }
        ]);
    }



    if (sentMessage.indexOf("!register") == 0) {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            if (message.mentions && message.mentions.users) {
                var id = message.mentions.users.first().id;
                var mentioned_user = message.mentions.users.first();
                var username = message.content.replace("!register ", "").replace("<@" + id + "> ", "");
                async.series([
                    function doAuth(step) {
                        userDoc.useServiceAccountAuth(googleCreds, step);
                    },
                    function doRegister(step) {
                        userDoc.getRows(1, {
                            query: "userid = " + id
                        }, function(error, rows) {
                            if (error) {
                                channel.sendMessage("ERROR: " + err);
                            } else if (rows.length > 0) {
                                channel.sendMessage("User already inserted.").catch(console.error);
                            } else {

                                userDoc.addRow(1, {
                                    "userid": id,
                                    "user": username
                                }, function(err) {
                                    if (err) {
                                        console.log(err);
                                        channel.sendMessage("Error in inserting the user in.").catch(console.error);
                                    } else {
                                        message.guild.members.get(mentioned_user.id).addRole("282972642636726294");
                                        channel.sendMessage(mentioned_user + " has been registered to " + username).catch(console.error);
                                    }
                                });
                            }
                        });
                    }
                ]);
            }
        }
    }

    if (sentMessage == "!nico") {
        channel.sendMessage("Nico Nico Nii~!");
    }

    if (sentMessage.indexOf("!clean") == 0) {
        function deleteMessage(element, index, array) {
            element.delete();
            return true;
        }

        if (is_sender_admin(message) || is_sender_mod(message)) {
            var parameters = message.content.replace("!clean ", "").split(" ");
            var number = parseInt(parameters.pop()) + 1;
            var word = parameters.join(" ");
            console.log(word);
            channel.fetchMessages({
                limit: number
            }).then(messages => messages.every(deleteMessage)).catch(console.error);
        }
    }
    if (sentMessage.indexOf("!whois") == 0) {
        //mybot.sendMessage("124712527975284736", message.mentions);
        if (message.mentions && message.mentions.users) {
            var id = message.mentions.users.first().id;
            var mentioned_user = message.mentions.users.first();
            //message.author.sendMessage(id);
            async.series([
                function doAuth(step) {
                    userDoc.useServiceAccountAuth(googleCreds, step);
                },
                function doWhois(step) {
                    var user = null;
                    userDoc.getRows(1, {
                        query: "userid = " + id
                    }, function(error, rows) {
                        if (error) {
                            console.log(error);
                        } else if (rows != null && rows[0]) {
                            if (rows[0].hasOwnProperty('user')) {
                                user = rows[0].user;
                                channel.sendMessage(mentioned_user + " is " + user + ".");
                            }
                        } else {
                            channel.sendMessage("User not found. Please register the user with a name.").catch(console.error);
                        }
                    });
                    if (user == null) {
                        //channel.sendMessage("User not found. Please register the user with a name.");
                    }
                }
            ]);
        }
    }

    if (sentMessage.indexOf("!aao") == 0) {
        channel.sendMessage("This is Ace Attorney Online (AAO), a free online trial-making site, which can be found here: <http://hnng.moe/3uO> \nIf you're looking for the Ace Attorney based chat room, you're probably looking for Attorney Online, which can be found here: <http://hnng.moe/3ts>").catch(console.error);
    }

    if (sentMessage.indexOf("!ping") == 0)
        message.reply("pong").catch(console.error);

    if (sentMessage.indexOf("!banid") == 0) {
        var id = message.content.replace("!banid ", "");
        if (is_sender_mod(message) || is_sender_admin(message)) {
            if (id != '' && typeof id === 'string') {
                message.guild.ban(id).catch(console.log);
            } else {
                message.reply("No id given.").catch(console.error);
            }
        }
    }

    if (sentMessage.indexOf("!red") == 0) {
        var red_text = message.content.substring(4);
        var author_name = message.author.username;
        message.delete();
        channel.sendMessage(author_name + " said:\n```diff\n-" + red_text + "```").catch(console.error);
    }

    if (sentMessage.indexOf("!blue") == 0) {
        var blue_text = message.content.substring(5);
        var author_name = message.author.username;
        message.delete();
        channel.sendMessage(author_name + " said:\n```xl\n" + blue_text + "```").catch(console.error);
    }

    if (sentMessage.indexOf("!spoiler") >= 0) {
        var pre_spoiler_text = message.content.substring(0, sentMessage.indexOf("!spoiler"));
        var spoiler_text = "";
        var post_spoiler_text = "";
        var author = message.author;
        var message_id = message.id;
        if (!is_bot(author, server) && (!(author.id == "134374287564865536"))) {
            if (sentMessage.indexOf("!endspoiler") != -1 && (sentMessage.indexOf("!endspoiler") > sentMessage.indexOf("!spoiler"))) {
                spoiler_text = message.content.substring(sentMessage.indexOf("!spoiler") + "!spoiler".length, message.content.indexOf("!endspoiler"));
                post_spoiler_text = message.content.substring(sentMessage.indexOf("!endspoiler") + "!endspoiler".length, message.content.length);
            } else {
                spoiler_text = message.content.substring(sentMessage.indexOf("!spoiler") + "!spoiler".length, message.content.length);
            }
            message.delete();

            if (post_spoiler_text) {
                channel.sendMessage(author + ": " + pre_spoiler_text + " SPOILER - " + encrypt(spoiler_text, "shovel") + " - " + post_spoiler_text).catch(console.error);
            } else {
                channel.sendMessage(author + ": " + pre_spoiler_text + " SPOILER - " + encrypt(spoiler_text, "shovel")).catch(console.error);

            }
        }
    } //

    if ((sentMessage.indexOf("!decrypt ") == 0) || sentMessage.indexOf("!decode ") == 0) {
        var unmodified_text = message.content.replace("!decrypt", "");
        unmodified_text = unmodified_text.replace("!decode", "");
        var author = message.author;
        author.sendMessage(decrypt(unmodified_text, "shovel")).catch(console.error);
    }

    if ((sentMessage.indexOf("!decryptlast") == 0) || sentMessage.indexOf("!decodelast") == 0) {

        var contentArray = sentMessage.split(" ");
        var apparentNumber = parseInt(contentArray[1]);
        var decodeNumbers = 1;

        if (!isNaN(apparentNumber)) {
            decodeNumbers = apparentNumber;
        }

        if (decodeNumbers > 10) {
            decodeNumbers = 10;
        }

        decodeMessages(channel, decodeNumbers, message);

    }

    if (sentMessage.indexOf("!createchannel") == 0) {
        var channel_name = message.content.replace("!createchannel", "").replace(" ", "");

        if (server.channels.get("name", channel_name)) {
            channel.sendMessage("Channel already exists.");
        } else {
            if (message.author.id == "132481273078743040") {
                message.reply("Hahaha, no creating channels for YOU.");
            } else {
                server.createChannel(channel_name).then(function(channel) {
                    channel.sendMessage("Channel " + channel_name + " created.").catch(console.error);
                }).catch(function(error) {
                    channel.sendMessage("Channel " + channel_name + " not created. ERROR: " + error).catch(console.error);
                });
            }
        }
    }

    if (sentMessage.indexOf("!deletechannel") == 0) {

        var channel_name = message.content.split(" ")[1];
        var delete_channel = server.channels.find("name", channel_name);
        if (!delete_channel) {
            channel.sendMessage("Channel " + channel_name + " does not exist.").catch(console.error);
        } else {
            if (delete_channel && !core_channel(delete_channel.id)) {
                delete_channel.delete();
                channel.sendMessage("Channel " + channel_name + " has been deleted.").catch(console.error);
            } else {
                channel.sendMessage("You can't delete this channel. Please ask an admin to delete this channel.").catch(console.error);
            }
        }
    }
    if (is_sender_mod(message) || is_sender_admin(message)) {
        if (sentMessage.indexOf("!lock") == 0) {
            var channel_array = message.guild.channels.array();
            for (var x = 0; x < channel_array.length; x++) {
                if (channel_array[x].type == "text") {
                    channel_array[x].overwritePermissions(message.channel.guild.id, {
                        'SEND_MESSAGES': false
                    });
                }
            }
        }

        if (sentMessage.indexOf("!unlock") == 0) {
            var channel_array = message.guild.channels.array();
            for (var x = 0; x < channel_array.length; x++) {
                if (channel_array[x].type == "text" && channel_array[x].id != "162742929071276033") {
                    channel_array[x].overwritePermissions(message.channel.guild.id, {
                        'SEND_MESSAGES': true
                    });
                }
            }
        }
    }

    if (sentMessage.indexOf("!roll") == 0) {
        var potentialNumber = parseInt(message.content.replace("!roll", "").replace(" ", ""));
        if (!isNaN(potentialNumber)) {
            var randomNumber = Math.floor((Math.random() * potentialNumber) + 1);
        } else {
            var randomNumber = Math.floor((Math.random() * 100) + 1);
        }
        message.reply(randomNumber).catch(console.error);
    }

    if (sentMessage.indexOf("!dice") == 0) {
        var randomNumber = Math.floor((Math.random() * 6) + 1);
        message.reply(randomNumber).catch(console.error);
    }

    if (sentMessage.indexOf("!die") == 0) {
        message.reply("4").catch(console.error);
    }

    if (sentMessage.indexOf("!coin") == 0) {
        var randomNumber = Math.floor((Math.random() * 100) + 1);
        if (randomNumber <= 50) {
            message.reply("heads").catch(console.error);
        } else {
            message.reply("tails").catch(console.error);
        }
    }

    if (sentMessage.indexOf("!weather") == 0) {
        var query = message.content.replace("!weather ", "");
        request("http://api.openweathermap.org/data/2.5/weather?q=" + query + "&appid=" + auth.WEATHER_API, function(error, response, body) {
            if (error) {
                console.log(error);
            }
            if (!error && response.statusCode == 200) {
                var weatherData = JSON.parse(body);
                if (weatherData.cod != 404) {
                    var loc = weatherData.name;
                    var country = weatherData.sys.country;
                    var temperature = weatherData.main.temp - 273;
                    var fahrenheit = temperature * (9 / 5) + 32;
                    var weather = weatherData.weather[0].main;
                    var description = weatherData.weather[0].description;
                    temperature = Math.round(temperature * 10) / 10;
                    fahrenheit = Math.round(fahrenheit * 10) / 10;

                    channel.sendMessage(loc + ", " + country + "\nCurrent weather: " + weather + " - " + description + "\nCurrent temperature: " + temperature + "°C/" + fahrenheit + "°F").catch(console.error);
                } else {
                    channel.sendMessage("City not found.").catch(console.error);
                }
            }
        });
    }

    if (sentMessage.indexOf("o lol") == 0) {

        if (!ignore_olol && message.author.id != "134374287564865536") {
            ignore_olol = true;
            channel.sendMessage("o lol").catch(console.error);
        }
    }
    setTimeout(function() {
        ignore_olol = false;
    }, 6000);


    if (sentMessage == "o/" && message.author.id != "134374287564865536") {
        channel.sendMessage("\\o").catch(console.error);
    }

    if (sentMessage == "\\o" && message.author.id != "134374287564865536") {
        channel.sendMessage("o/").catch(console.error);
    }

    if (sentMessage == "o7") {
        message.reply("Yousoro! o7").catch(console.error);
    }

    if (sentMessage.indexOf("!ohmygod") == 0) {
        channel.sendMessage("https://www.youtube.com/watch?v=hYMLbBG1dOg").catch(console.error);
    }

    if (sentMessage.indexOf("!cards") == 0) {
        var number = parseInt(message.content.replace("!cards", "").replace(" ", ""));
        if (isNaN(number)) {
            number = 5;
        } else if (number > 52) {
            number = 52;
        }
        var temp_cards = cards.slice();
        temp_cards = shuffle(temp_cards);

        var held_cards = temp_cards.splice(0, number);

        channel.sendMessage(held_cards.toString()).catch(console.error);

    }

    if (sentMessage.indexOf("!rps") == 0) {
        var thrown = message.content.replace("!rps ", "").replace("!rps", "");

        if (thrown.length > 0) {
            var randomNumber = Math.floor((Math.random() * 3) + 1);

            switch (thrown) {
                case "rock":
                    if (randomNumber == 1)
                        message.reply("I threw rock!\nIt's a tie!").catch(console.error)
                    if (randomNumber == 2)
                        message.reply("I threw paper!\nI win!").catch(console.error)
                    if (randomNumber == 3)
                        message.reply("I threw scissors!\nI lose.").catch(console.error);
                    break;
                case "paper":
                    if (randomNumber == 1)
                        message.reply("I threw rock!\nI lose.").catch(console.error)
                    if (randomNumber == 2)
                        message.reply("I threw paper!\nIt's a tie!").catch(console.error);
                    if (randomNumber == 3)
                        message.reply("I threw scissors!\nI win!").catch(console.error);
                    break;

                case "scissors":
                    if (randomNumber == 1)
                        message.reply("I threw rock!\nI win!").catch(console.error)
                    if (randomNumber == 2)
                        message.reply("I threw paper!\nI lose.").catch(console.error);
                    if (randomNumber == 3)
                        message.reply("I threw scissors!\nIt's a tie!").catch(console.error);
                    break;


            }
        } else {
            var randomNumber = Math.floor((Math.random() * 3) + 1);
            if (randomNumber == 1) {
                message.reply("rock").catch(console.error);
            } else if (randomNumber == 2) {
                message.reply("paper").catch(console.error);
            } else {
                message.reply("scissors").catch(console.error);
            }
        }
    }

    //End of useful functions

    //Dank AAO memes
    if ((sentMessage.indexOf("kitchens") >= 0) && (sentMessage.indexOf("uk") >= 0)) {
        var author = message.author;
        if (!is_bot(author, server)) {
            message.delete();
            channel.sendMessage(author + ": no kitchens allowed </3").catch(console.error);
        }

    }

    if (sentMessage.indexOf("\*slaps kwando*") >= 0) {
        var author = message.author;
        if (!is_bot(author, server)) {
            channel.sendMessage(author + ": Uuu~").catch(console.error);
        }
    }

    if (sentMessage.indexOf("\*hugs kwando*") >= 0) {
        var author = message.author;
        if (!is_bot(author, server)) {
            channel.sendMessage(author + ": \\*HUG*").catch(console.error)
        }
    }

    if (sentMessage.indexOf("\*huggus kwando*") >= 0) {
        var author = message.author;
        if (!is_bot(author, server)) {
            channel.sendMessage(author + ": \\*HUGGUUUUUUUUUUU*").catch(console.error);
        }
    }

    if (sentMessage.indexOf("!someday") == 0) {
        message.reply("Someday... Someday on AAO.").catch(console.error);
    }

    if (sentMessage.indexOf("!deigo") == 0) {
        if (message.author.id === "124712527975284736") {
            send_image(channel, "https://cdn.discordapp.com/attachments/125447937735131136/135301501357654016/ripdeigo.png", "deigo.png").catch(console.error);
        }
        message.reply("okay").catch(console.error);

    }

    if (sentMessage.indexOf("!effort") == 0) {
        message.reply("that would take too much time and eff-").catch(console.error);
    }

    if (sentMessage.indexOf("!objection") == 0) {
        message.reply("IGIARI!").catch(console.error);
    }

    if (sentMessage.indexOf("!naitousama") == 0) {
        message.reply("IGIARRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRI!").catch(console.error);
    }

    if (sentMessage.indexOf("!shame") == 0) {
        channel.sendMessage("Shame. Shaaaaaaaaaaame. SHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAME.").catch(console.error);
    }

    if (sentMessage.indexOf("!hazama") == 0) {
        channel.sendMessage("Keys, anyone?").catch(console.error);
    }

    if (sentMessage.indexOf("!keys") == 0) {
        channel.sendMessage("Anyone?").catch(console.error);
    }

    if (sentMessage.indexOf("!german") == 0) {
        channel.sendMessage("Straße.").catch(console.error);
    }

    if (sentMessage.indexOf("!timewarp") == 0) {
        channel.sendMessage("Enigma returned from Japan!!!!").catch(console.error);
    }

    if (sentMessage.indexOf("!apfelschorle") == 0) {
        channel.sendMessage("Best drink ever~ <3").catch(console.error);
    }
    //End of dank AAO memes

    //Dank osu memes
    if (sentMessage.indexOf("!brainpower") == 0) {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            channel.sendMessage("O-oooooooooo AAAAE-A-A-I-A-U- JO-oooooooooooo AAE-O-A-A-U-U-A- E-eee-ee-eee AAAAE-A-E-I-E-A- JO-ooo-oo-oo-oo EEEEO-A-AAA-AAAA").catch(console.error);
        }
    }

    if (sentMessage.indexOf("!defenders") == 0) {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            channel.sendMessage("HOLD ON\nSTAY STRONG").catch(console.error);
        }
    }

    if (sentMessage.indexOf("!azer") == 0) {
        if (is_sender_mod(message) || is_sender_admin(message)) {
            channel.sendMessage("tied with United, the highest HDHR play\nOF ALL TIME!\n(493 pp)").catch(console.error);
        }
    }

    if (sentMessage.indexOf("!united") == 0) {
        channel.sendMessage("N E V E R G I V E U P").catch(console.error);
    }

    if (sentMessage === "!gangsta") {
        channel.sendMessage("NO he hates the song.").catch(console.error);
    }

    if (sentMessage === "!res") {
        channel.sendMessage("full screen 1080p").catch(console.error);
    }

    if (sentMessage.indexOf("!osu") == 0) {
        channel.sendMessage("osu! is free and you can download it here http://hnng.moe/3DM").catch(console.error);
    }


    if (sentMessage.indexOf("!camp") == 0) {
        channel.sendMessage("People are here because the camp never dies. http://hnng.moe/f/4WX http://hnng.moe/f/5Ob\nRIP shigebot command :'(").catch(console.error);
    }
    /*
    if (sentMessage.indexOf("!imagematerial") == 0) {
        channel.sendMessage("http://hnng.moe/3za");
    }

    if (sentMessage.indexOf("!bluezenith") == 0) {
        channel.sendMessage("http://hnng.moe/3zb");
    }

    if (sentMessage.indexOf("!gangstadt") == 0) {
        channel.sendMessage("http://hnng.moe/3zc");
    }*/

    if (sentMessage.indexOf("!insaneosuplays") == 0) {
        var randomNumber = Math.floor((Math.random() * osu_plays.length));
        channel.sendMessage(osu_plays[randomNumber]).catch(console.error);
    }

    //There are no more dank osu memes below here.

    //Dank Touhou memes???

    if (sentMessage.indexOf("!strongest") == 0) {
        var randomNumber = Math.floor((Math.random() * 200));
        if (message.author.id == "134370078887116800") {
            if (randomNumber < 70) {
                channel.sendMessage("Cirno is stronger than Suwako.").catch(console.error)
            } else if ((randomNumber == 100)) {
                channel.sendMessage("It's a tie!").catch(console.error)
            } else {
                channel.sendMessage("Suwako is stronger than Cirno.").catch(console.error)
            }
        } else {
            if (randomNumber == 1) {
                channel.sendMessage("Cirno is stronger than Suwako.").catch(console.error)
            } else if ((randomNumber == 2) || (randomNumber == 3)) {
                channel.sendMessage("It's a tie!").catch(console.error)
            } else {
                channel.sendMessage("Suwako is stronger than Cirno.").catch(console.error)
            }
        }
    }

    if (sentMessage.indexOf("!cirno") == 0) {
        channel.sendMessage("I'm the strongest!").catch(console.error)
    }

    if (sentMessage.indexOf("!kero") == 0) {
        channel.sendMessage("https://www.youtube.com/watch?v=JUBbigtfCWs").catch(console.error)
    }

    if (sentMessage.indexOf("!nineball") == 0) {
        channel.sendMessage("https://www.youtube.com/watch?v=H8OWSlqz1h4").catch(console.error)
    }

    if (sentMessage.indexOf("!revolution") == 0) {
        channel.sendMessage("https://www.youtube.com/watch?v=qH99atqhzqY").catch(console.error)
    }

    if (sentMessage.indexOf("!suwako") == 0) {
        channel.sendMessage("Kero~").catch(console.error)
    }

    //Bot info!
    if (sentMessage.indexOf("!name") == 0) {
        channel.sendMessage(mybot.user.username).catch(console.error)
    }


    if (sentMessage.indexOf("!about") == 0) {
        channel.sendMessage("This is a bot made by kwando1313.").catch(console.error)
    }

    if (sentMessage.indexOf("!commands") == 0) {
        message.author.sendMessage("An updated list of commands will be coming soon. :tm:").catch(console.error)
    }


});

console.log("Logging in...");

mybot.login(auth.token);


mybot.on('ready', function() {
    console.log("I'm ready to start a blizzard!");
    mybot.user.setGame("Love Live");
    var aao_server = mybot.guilds.get("137392287108825088");
    if (aao_server.available) {
        remove_stale_channels(aao_server.channels.array());
    }

});

function remove_stale_channels(channels) {
    for (var x = 0; x < channels.length; x++) {
        var channel = channels[x];
        if (!core_channel(channel) && channel.type == "text") {
            channel.fetchMessages({
                limit: 1
            }).then(function(messages) {
                if (messages) {
                    var actual_messages = messages.array();
                    var last_message = actual_messages[0];
                    var current_timestamp = Date.now();

                    if (current_timestamp - last_message.createdTimestamp > 1209600000) {
                        console.log(channel);
                        last_message.channel.delete();
                    }
                }
            }).catch(function(error) {
                console.log(error);
            });
        }
    }
}

function core_channel(channel) {
    var core_channels = ["147162584360026114", "162742929071276033", "162070607981314049", "137392287108825088", "137574047973113856", "178345405338091522", "140250642781437952", "125447937735131136", "134877703248674816", "211419994020511744", "140937367262330880", "205890364534423552", "177282124234227712"];
    if (core_channels.indexOf(channel.id) > -1) {
        return true;
    }
    return false;
}

function send_image(channel, url, name) {
    channel.sendFile(url);
}

function mode(array) {
    if (array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0],
        maxCount = 1;
    for (var i = 0; i < array.length; i++) {
        var el = array[i].id || array[i];
        if (modeMap[el] == null) {
            modeMap[el] = 1;
        } else {
            modeMap[el]++;
        }
        if (modeMap[el] > maxCount) {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function decodeMessages(channel, decodeNumbers, message) {

    channel.fetchMessages().then(function(messages) {
        var last = false;

        function check(element, index, array) {
            if ((element.content.indexOf("SPOILER - ") >= 0) && (element.author.id == "134374287564865536") && !last) {
                var phrase = "";
                if (element.content.indexOf("SPOILER - ") == (element.content.lastIndexOf(" - ") - 7)) {
                    phrase = element.content.slice(element.content.indexOf("SPOILER - ") + 10);
                } else {
                    phrase = element.content.slice(element.content.indexOf("SPOILER - ") + 10, element.content.lastIndexOf(" - "));
                }
                message.author.sendMessage(decrypt(phrase, "shovel"));

                decodeNumbers--;
                if (decodeNumbers <= 0) {
                    last = true;
                }
            }
        }
        if (messages) {
            messages.forEach(check);
        }
    }).catch(function(error) {
        console.log(error);
    });
}

function checkInArray(array, object) {
    var length_of_array = array.length;

    for (var x = 0; x < length_of_array; x++) {
        if (object.equals(array[x])) {
            return true;
        }
    }
    return false;
}

function checkIndexInArray(array, object) {
    if (checkInArray(array, object)) {
        var length_of_array = array.length;

        for (var x = 0; x < length_of_array; x++) {
            if (object.equals(array[x])) {
                return x;
            }
        }
    }
    return -1;
}

function is_sender_mod(message) {
    var user = message.author.id;
    var server = message.channel.guild;

    if (!server) return false;

    for (var role of server.members.get(user).roles.array()) {
        if (role.id === "134165053493608448" || role.name == "Moderators") {
            return true;
        }
        if (role.hasPermission('MANAGE_CHANNELS')) {
            return true;
        }
    }
    return false;
}


function is_sender_admin(message) {
    var user = message.author.id;
    var server = message.channel.guild;

    if (!server) return false;

    for (var role of server.members.get(user).roles.array()) {
        if (role.id === "134164978096799744" || role.name == "Administrators") {
            return true;
        }
        if (role.hasPermission('ADMINISTRATOR')) {
            return true;
        }
    }

    return false;
}

function can_manage_messages(message) {
    return false;
}



function is_bot(user, server) {
    if (!server) return false;

    for (var role of server.members.get(user.id).roles) {
        if (role.id === "134375530332946433" || role.name == "Bots" || role.name == "ServerBot") {
            return true;
        }
    }
    return false;
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function millisecondsToStr(milliseconds) {
    // TIP: to find current time in milliseconds, use:
    // var  current_time_milliseconds = new Date().getTime();

    function numberEnding(number) {
        return (number > 1) ? 's' : '';
    }


    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    var date_string = "";
    if (years) {
        date_string = date_string + years + ' year' + numberEnding(years);
    }
    //TODO: Months! Maybe weeks? 
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        date_string = date_string + " " + days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        date_string = date_string + " " + hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        date_string = date_string + " " + minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds && minutes) {
        date_string = date_string + " " + "and " + seconds + ' second' + numberEnding(seconds);

    } else if (seconds) {
        date_string = date_string + " " + seconds + ' second' + numberEnding(seconds);
    }
    if (date_string != "") {
        return date_string + "."
    }
    return 'less than a second'; //'just now' //or other string you like;
}

String.prototype.rot13 = function() {
    return this.replace(/[a-zA-Z]/g, function(c) {
        return String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
};