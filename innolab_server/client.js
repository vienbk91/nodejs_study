 
var io = require('socket.io-client');
var url = "localhost";
var options = {
    'force new connection':true,
    port:8123
};

var socket;
socket = io.connect(url, options);
socket.on('connect', function (data) {

    // 謗･邯夐幕蟋・
    console.log("connect");
    data = { "room_id":1, "user_id":1 };
    console.log( "SEND:connect_begin" );
    socket.emit("connect_begin",data); // 謗･邯夐幕蟋九ｒ騾夂衍

});

// 謗･邯夐幕蟋狗ｵゆｺ・
socket.on('connect_begin_end', function (msg) {
    console.log( 'RECEIVE: connect_begin_end' );

    // 譛ｬ譚･縺ｯ縺薙％縺ｧ逕ｻ髱｢謫堺ｽ・繝√・繝驕ｸ謚樒判髱｢縺ｸ・・

    // 繝√・繝驕ｸ謚・connect_select_team
    data = { "room_id":1, "user_id":1, "team_id":1 };
    console.log( "SEND:connect_select_team" );
    socket.emit("connect_select_team",data); 
    
});

// 繝√・繝驕ｸ謚槫ｮ御ｺ・
socket.on('connect_select_team_end', function (msg) {
    console.log( 'RECEIVE: connect_select_team_end' );

    // 譛ｬ譚･縺ｯ縺薙％縺ｧ逕ｻ髱｢謫堺ｽ・繝ｦ繝九ャ繝磯∈謚樒判髱｢縺ｸ

    // 繝ｦ繝九ャ繝磯∈謚・connect_select_unit
    data = { "room_id":1, "user_id":1, "team_id":1, "unit_id":1 };
    console.log( "SEND:connect_select_unit" );
    socket.emit("connect_select_unit",data); 
    
});

// 繝ｦ繝九ャ繝磯∈謚槫ｮ御ｺ・
socket.on('connect_select_unit_end', function (msg) {
    console.log( 'RECEIVE: connect_select_unit_end' );

    // 譛ｬ譚･縺ｯ縺薙％縺ｧ逕ｻ髱｢謫堺ｽ・繧ｹ繧ｭ繝ｫ驕ｸ謚・

    // 繝ｦ繝九ャ繝磯∈謚・connect_select_skill
    var skillList = new Array();
    var skill1 = new Object();
    var skill2 = new Object();
    skill1['mst_skill_id'] = 1;
    skill2['mst_skill_id'] = 2;
    skillList.push(skill1)
    skillList.push(skill2)
    data = { "room_id":1, "user_id":1, "team_id":1, "unit_id":1,
		"player_skill_list":skillList }
    console.log( "SEND:connect_select_skill" );
    socket.emit("connect_select_skill",data); 
    
});

// 繧ｹ繧ｭ繝ｫ驕ｸ謚槫ｮ御ｺ・
socket.on('connect_select_skill_end', function (msg) {
    console.log( 'RECEIVE: connect_select_skill_end' );

    // 譛ｬ譚･縺ｯ縺薙％縺ｧ逕ｻ髱｢謫堺ｽ・蠕・■逕ｻ髱｢

    // 貅門ｙ螳御ｺ・ｒ騾√ｋ
    data = { "room_id":1, "user_id":1, "team_id":1 };
    socket.emit("connect_ready",data); 
    
});

/*
setTimeout(function(){
    socket.emit("sendMsgFromClient","send client msg");
},3000);
*/
