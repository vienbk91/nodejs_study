var http = require('http');
 
require( './model.js' );

// 1.モジュールオブジェクトの初期化
var fs  = require("fs");
var sys = require ('sys'),
url  = require('url'),
http = require('http'),
qs   = require('querystring');

var rU = mongoose.model('Room_user');
rU.remove({}, function(data) {
	//
	var uU = mongoose.model('User_unit');
	uU.remove({}, function(data) {
		var uUS = mongoose.model('User_unit_skill');
		uUS.remove({}, function(data) {
			var uS = mongoose.model('User_skill');
			uS.remove({}, function(data) {
				console.log("Remove old data completed");
				////
			});
		});	
	});
});



var userHash = {}; // ユーザ管理ハッシュ
var roomHash = {}; // ルーム管理ハッシュ

// 2.イベントの定義
var server = require('http').Server();
var socketIO = require('socket.io');
var io = socketIO.listen(server);

io.sockets.on("connection", function (socket) {
	console.log("connect with socketId: "+ socket.id);
	// 接続開始
	socket.on("connect_begin", function (data) {
		console.log('EVENT:______________connect_begin');
		console.log("RECEIVE DATA:");
		console.log(data);
		var data = JSON.parse(data);
		var room_id = data['room_id'];
		var user_id = data['user_id'];
		var uuid = data['uuid'];
	
		// ユーザー管理ハッシュに登録
		userHash[uuid] = socket.id;
		console.log("USER HASH:");
		console.log(userHash);


		// (*Sample) ルーム管理ハッシュに登録
		//roomHash[room_id][user_id] = socket.id;
		//console.log("ROOM HASH:");
		//console.log(roomHash);
		//socket.join(data['room_id']);

		// (*Sample) 全ユーザーに接続を通知(画面内ので省略
		//io.sockets.emit("publish", {value: "publish test"});

		// (*Sample) ソケットに部屋を割り当て
		//socket.join(data['room_id']);

		// TODO: 既に登録されていたらERROR

		// TODO: 満員ならERROR

		// room_users に登録
		RoomUser_add( data, function(rdata){
			// 処理完了を通知
			/*rdata['uuid'] = data['uuid'];
		    Emit_to_all_other_clients(rdata, "room_public_connect", function () {
		        socket.emit("connect_begin_end", rdata);
		    });
			*/
			BroadcastData(socket, "room_public_connect", function () {
				socket.emit("connect_begin_end", rdata);
			}, rdata);
			// (Sample) Room内の全ユーザーへの通知
			//io.sockets(room_id).emit( "room_publish", {status:"test"} );
			

		} );

	});
	//This function was defined for process when player re-select user or may be when network re-connect
	//When client reconnect to sever. All of data from before section will be delete
	socket.on('reconnect', function(data) {
		console.log("Reconnect");
		console.log(data);
		Client_disconnect(socket.id, function (data) {
			console.log("Reconnect end data");
			console.log(data);
		})
	});

	//  チーム選択
	socket.on('connect_select_team', function(data){
		console.log('EVENT:______________connect_select_team');
		console.log("RECEIVE DATA:");
		console.log(data);
		var data = JSON.parse(data);

		// room_users を更新
		RoomUser_selectTeam( data, function(data){
			//  (Sample) チーム管理ハッシュに登録
			//teamHash[data['room_id']][data['team_id']][data['user_id']] = socket.id;
			//console.log("ROOM HASH:");
		    //console.log(roomHash);
		    RoomUser_updateState(data, 2, function (data) {
		        Emit_to_all_other_clients(data, "room_public_select_team_end", function () {
		            socket.emit('connect_select_team_end', data);
		        });
		    });
			// 処理完了を通知
			
		} );
		

	});

	//  ユニット選択
	socket.on('connect_select_unit', function(data){

		console.log('EVENT:______________connect_select_unit');
		console.log("RECEIVE DATA:");
		console.log(data);
		var data = JSON.parse(data);

		// user_units  を更新
		UserUnit_add( data, function(re_data){
			// 処理完了を通知
			Emit_to_all_other_clients(data,'room_public_select_unit_end', function() {
				// room_users のステータスを更新
				RoomUser_updateState(data, 3, function (data) {
		        socket.emit('connect_select_unit_end', data);        
		   		});
		    });
		});


	});

	// スキル選択
	socket.on('connect_select_skill', function(data){

		console.log('EVENT:______________connect_select_skill');
		console.log("RECEIVE DATA:");
		console.log(data);
		var data = JSON.parse(data);

		// user_skillsを更新
		UserSkill_add( data, function(redata){
			//emit selected event to all player in room.
			Emit_to_all_other_clients(data, 'room_public_select_skill_end', function() {
				RoomUser_updateState(data, 4, function (data) {
		        	socket.emit('connect_select_skill_end', data);
		        });
			});
			
		});

	});

	// 準備完了
	socket.on('connect_ready', function(data){
		console.log('EVENT:______________connect_ready');
		console.log("RECEIVE DATA:");
		console.log(data);
		var data = JSON.parse(data);
	
		// room_users のステータスを更新
		RoomUser_updateReady(data, 1, function (rdata) {
		    socket.emit('connect_ready_end', rdata);
		    // TODO: 全員分のreadyが揃ったら、全員に開始通知を送る 
			Check_battle_start(data, function(data1) {
				console.log("All player ready. Sending start event");
				io.sockets.emit('room_public_battle_start',data1);
				Battle_start(data1);
			});
		});

		// 処理完了を通知 - 使わないけど一応
		

		

	});

	//Battle Sync
	socket.on('sync',function(data) {

		console.log("Event: ______________battle/sync");
		console.log('RECEIVE DATA');
		console.log(data);
		var data = JSON.parse(data);

		//do something here
		//update all  data from unit and skill
		UserUnit_update(data, function(data) {
			Battle_sync(data,function(data) {
				//afer that:
				socket.emit('sync_end',data);
			});
		});


		

		

	});

	//Battle attack
	socket.on('attack',function(data) {
		console.log("Event: ______________battle/attack");
		console.log("RECEIVE DATA: ");
		console.log(data);
		var data = JSON.parse(data);

		//TODO
		//caculate dame
		//
		Battle_attack(data, function(data) {

			socket.emit('attack_end',data);
		});
		//TODO
		//get all socket id of user in room
		//emit data to all room user
		//io.sockets(data['room_id']).emit( "room_publish_attack", {status:"test data"} );
	});

	//Battle move
	socket.on('move',function(data) {
		console.log("Event: ______________battle/move");
		console.log("RECEIVE data");
		console.log(data);
		var data = JSON.parse(data);

		//TODO
		Battle_move(data, function(data1) {
			//socket.emit('move_end', data);
			//Emit_to_all_other_clients(data, "battle_public_move", function() {
			//console.log("Emit move event Completed");
			Battle_sync(data, function(rdata) {
				rdata['direction'] = data['direction'];
				rdata['angle'] = data['angle'];
				rdata['uuid'] = data['uuid'];
				Emit_to_all_other_clients(rdata, "move_sync_end", function(params) {
					console.log("Battle synction completed");
				});
			});
		});
		//TODO
		//get all socket id of room user
		//emit data to all
		
	});
	
	//battle move end
	socket.on('move_end', function(data) {
		console.log("==============================================================");
		console.log("Event MoveEnd with data: "+ data);
		var data = JSON.parse(data);
		Emit_to_all_other_clients(data,"unit_move_end", function () {
			console.log("Completed broadcast data");
		})
	});

	//battle Dead
	socket.on('dead', function(data) {
		console.log("Event : Battle/DEAD")
		console.log(data);
		var data = JSON.parse(data);
		UserUnit_update(data, function(re_data) {
			console.log('User unit update Completed');
			Emit_to_all_other_clients(data, "battle_public_dead", function () {
			    socket.emit('dead_end', re_data);
			    socket.console('Battle Dead END');
			});
		});

	});

	//Battle respawn
	socket.on('respawn',function(data) {
		console.log("Event: ______________battle/respawn");
		console.log("RECEIVE DATA: ");
		console.log(data);
		var data = JSON.parse(data);

		//TODO

		socket.emit('respawn_end',{status: "ok"});
		//TODO
		//do something here

	});

	socket.on('skill_player',function(data) {
		console.log("Event: ====================battle/skill_player");
		console.log("RECEIVE DATA");
		console.log(data);
		var data = JSON.parse(data);

		//TODO
		//caculate skill data
		//update effected unit status/ hp
		//update user status (mp, status)

		socket.emit('skill_end',data);
		//TODO
		//calculate countdown time
		//send data to all user in room

	});
	socket.on('skill_unit',function(data) {
		console.log("Event: ====================battle/skill_unit");
		console.log("RECEIVE DATA");
		console.log(data);
		var data = JSON.parse(data);

		//TODO
		//caculate skill data
		//update effected unit status/ hp
		//update user status (mp, status)

		socket.emit('skill_end',data);
		//TODO
		//calculate countdown time
		//send data to all user in room

	});
	
	socket.on("kill_unit", function(data) {
		console.log("Received KILL Event with data: " +  data);
		
	});


	socket.on('battle_end',function(data) {
		console.log("Event: --------->battle/end<---------");
		console.log("RECEIVE DATA: ");
		console.log(data);
		var data = JSON.parse(data);
		Battle_end(data, function(data) {
			socket.emit('battle_end_end',{status: "ok"});
		});
		//TODO
		Emit_to_all_other_clients(data, "battle_public_battle_end",function() {
			console.log("battle_end public end");
		});
	});

	// 接続終了組み込みイベント(接続元ユーザを削除し、他ユーザへ通知)
	socket.on("disconnect", function (data) {
		console.log('EVENT:disconnect ');
		Client_disconnect(socket.id, function(rdata) {
			Emit_to_all_other_clients(rdata,"room_public_disconnect", function() {
				console.log("DISCONNECT END");
				//TODO need some process to delete disconnected socket id from user hash
				console.log(userHash);
			});
		});
		// TODO: 該当ユーザーのroom関連情報を全て削除、などの部屋制御を行う (Completed!);
	});

});
server.listen('8222');
console.log('NodeJs v 1.3.5 Server  running on port 8222!');

//When client disconnect. Remove all transaction data of disconnected user
// emnit to client new data list of room_user table
function Client_disconnect(socketID, handler) {
	console.log("socketID");
	console.log(socketID);
	console.log("User HASH: ");
	console.log(userHash);
	for (var key in userHash) {
		console.log(key);
		console.log(userHash[key]);
		console.log("===========");
		if(userHash[key] === socketID) {
			removeRoomUserbyUUID(key, function(data) {
				console.log("Remove Completed");
				console.log(data);
				if(data) {
					removeUserSkillDataByUserData(data, function(temp) {
						removeUserUnitDataByUserData(data, function(temp) {
							console.log("Remove all data when user disconnectd Completed");
							delete userHash[key];
							if (handler) {
								var Room_user = mongoose.model('Room_user');
								Room_user.find({}, function(err, rdata) {
									if(!err) {
										handler(rdata);
									}
										
								});

								return;
							};
						});
					});
				}

			});

		}
	}
}

//remove roomUserData by uuid return data is data of remove user in room_user table
function removeRoomUserbyUUID(uuid, handler) {
	console.log("UUID" +uuid);
	var Room_user = mongoose.model('Room_user');
	Room_user.findOne({room_user_id : uuid}, function(err,data) {
		console.log("Data after remove removeRoomUserbyUUID: ");
		console.log(data);
		//for return the data of disconnected user for next step (remove skill, unit...)
		Room_user.remove({room_user_id : uuid}, function(err) {
			if (err) { return console.log("Remove room user err");};
				if(handler) {
					handler(data);
				}			
		});
	});
	
}
//Remove user data from room_user by userdata
function removeRoomUserByUserData(data, handler) {
	var Room_user = mongoose.model('Room_user');
	Room_user.remove({user_id : data['user_id'], room_id : data['room_id']},function(err, collection) {

		if(err) {
			console.log(err);
			return;
		}
		if (handler) {
			handler(data);
		};
	});
}

//remove data from user_unit and User_unit_skills
//by user data
function removeUserUnitDataByUserData(data, handler) {
	var User_unit = mongoose.model('User_unit');
	var User_unit_skill = mongoose.model('User_unit_skill');

	User_unit.remove({user_id : data['user_id'], room_id : data['room_id']},function(err, collection) {
				if(err) {
				console.log(err);
				return;
				}else {
					console.log("Remove user_unit success");
				}
				User_unit_skill.remove({user_id : data['user_id'], room_id : data['room_id']}, function(err,collection) {
					if (err) {
						console.log(err);
						return;
					}else {
						console.log("remove User_unit_skill success");
					}
					if (handler) {
						handler(data);
					};
				});

			});
} 

//Remove data from User skills (Player skill info) by user data
function removeUserSkillDataByUserData(data, handler) {
	var User_skill = mongoose.model('User_skill');
	User_skill.remove({user_id : data['user_id'], room_id : data['room_id']},function(err) {
		if(err) {
			return console.log("remove user skill err");
		}
		if(handler) {
			handler(data);
		}
	});

}

//Emit to all another user
function Emit_to_all_other_clients(data, name, handler) {
    for (var key in userHash) {
        //console.log("KEY");
        console.log(key);
      	console.log("SENDER UUID");
        console.log(data['uuid']);
		if (userHash.hasOwnProperty(key) && key != data['uuid']) {
			console.log("Emit to another user by socket ID: ");
			console.log(userHash[key]);
			io.to(userHash[key]).emit(name, data);
		};
	}
	if(handler) {
		handler();
	}		
}

//Emit to all another user using socket.broadcast
function BroadcastData(socket, eventName, callbackHandler, data) {
	console.log("Broadcast data: "+data);
	socket.broadcast.emit(eventName, data);
	if(callbackHandler) {
		callbackHandler();
	}
}




// 以下機能関数群 > 後でクラスにまとめるかも

// room_users : 新規登録
//Add user data to room_user collections. Return value: All users in joined room
function RoomUser_add( data, handler ){ 
	
	var Room_user = mongoose.model('Room_user');
	var room_user = new Room_user();
	room_user.room_user_id = data['uuid'];
	room_user.room_id  = data['room_id'];
	room_user.user_id  = data['user_id'];
	room_user.team_id  = 0;
	room_user.ready    = 0;
	room_user.state    = 1;
	room_user.npc      = 0;
	room_user.save(function(err) {
		if (err) { console.log(err); }
		console.log('Add user success');
		//find all user in joined room
		Room_user.find({room_id : data['room_id']},function (err, result) {
		    if (err) return console.log("Find room_user fail");
		    if (handler) {
		        handler(result);
		    }
		});
		
	});
}

// room_users : チーム選択
function RoomUser_selectTeam( data, handler ){
        var Room_user = mongoose.model('Room_user');

	console.log( "UPDATE room_users START" );
	Room_user.findOne( { room_id:data['room_id'], user_id:data['user_id'] }, function(err,room_user){
		console.log( "UPDATE room_users END" );
		if(err || room_user=== null){ console.log(err); return; }
		room_user.team_id = data['team_id'];
		room_user.save( function(err,room_user){ 
        		console.log( 'room_user:' );
        		console.log( room_user );
			if( handler )
			{
				handler(data);
			}
		});
	} );
}

// room_users : ステータス更新
function RoomUser_updateState( data, state, handler ){
        var Room_user = mongoose.model('Room_user');

        console.log( "UPDATE room_users START" );
	console.log( data );
        Room_user.findOne( { room_id:data['room_id'], user_id:data['user_id'] }, function(err,room_user){
                console.log( "UPDATE room_users END" );
                if(err || room_user=== null){ console.log(err); return; }
                room_user.state = state;
                room_user.save( function(err,room_user){
                        console.log( 'room_user:' );
                        console.log( room_user );
                        if( handler )
                        {
                                handler(data);
                        }
                });
        } );
}

// room_users : 準備状態更新
function RoomUser_updateReady( data, ready, handler ){
        var Room_user = mongoose.model('Room_user');

        console.log( "UPDATE room_users START" );
        Room_user.findOne( { room_id:data['room_id'], user_id:data['user_id'] }, function(err,room_user){
                console.log( "UPDATE room_users END" );
                if(err || room_user=== null){ console.log(err); return; }
                room_user.ready = ready;
                room_user.save( function(err,room_user){
                        console.log( 'room_user:' );
                        console.log( room_user );
                        if( handler )
                        {
                                handler(data);
                        }
                });
        } );
}

// user_units :  新規追加ttea,OF
function UserUnit_add( data, handler ){
	var User_unit = mongoose.model('User_unit');
	var user_unit = new User_unit();
	user_unit.room_id  = data['room_id'];
	user_unit.user_id  = data['user_id'];
	user_unit.team_id  = data['team_id'];
	user_unit.mst_unit_id = data['unit_id'];
	user_unit.direction = 0;
	user_unit.position_x = data['mst_unit']['position_x'];
	user_unit.position_y = data['mst_unit']['position_y'];
	user_unit.hp = data['mst_unit']['hp'];
	user_unit.mp = data['mst_unit']['mp'];
	user_unit.status = 1;
	user_unit.save(function(err,user_unit) {

		if (err) { console.log(err); return; }
		console.log( 'success' );
		console.log( 'user_unit:' );
		console.log(user_unit);
		UserUnitSkill_add(data, function(data) {
			console.log("UserUnitSkill_add END");
			if (handler) {
				//return user_unit for client have unique id = collection index
		    	handler(user_unit);
			}
		});

		
	});
	
}

//user_unit update by battle sync nad battle move
function UserUnit_update(data, handler) {
    var User_unit = mongoose.model('User_unit');
    console.log("UserUnit update BEGIN");
	User_unit.findOne({room_id : data['room_id'],user_id : data['user_id'], mst_unit_id : data['user_unit']['mst_unit_id']}, function (err, user_unit) {
		if(err || user_unit === null) { console.log(err); return;}

		user_unit.hp = data['user_unit']['hp'];
		user_unit.mp = data['user_unit']['mp'];
		user_unit.position_x = data['position_x'];
		user_unit.position_y = data['position_y'];
		user_unit.direction = data['direction'];
		user_unit.status = data['status'];
		user_unit.save(function(err, user_unit) {
		    console.log('User_unit updated ');
			if (handler) {
				handler(user_unit);
			};
		});
	});
}

// user_skills : 新規追加
function UserSkill_add( data, handler ){

	var finishNum = 0;
	var procNum = data['player_skill_list'].length;
	for( var i=0; i<data['player_skill_list'].length; i++ )
	{
    	var User_skill = mongoose.model('User_skill');
    	var user_skill = new User_skill();
    	user_skill.room_id  = data['room_id'];
    	user_skill.user_id  = data['user_id'];
    	user_skill.team_id  = data['team_id'];
    	user_skill.mst_skill_id = data['player_skill_list'][i];
    	user_skill.cooldown_end_time = new Date().getTime();
    	user_skill.save(function(err, user_skill) {
            	if (err) { console.log(err); return; }
		finishNum++;
            	console.log( 'success '+finishNum+ "/"+procNum );
            	if( handler && finishNum>=procNum )
            	{
            	        handler(user_skill);
            	}
            	console.log( 'user_skill:' );
            	console.log( user_skill);
    	});
	}

}

//user_unit_skills
function UserUnitSkill_add(data, handler) {
	console.log("UserUnitSkill_add BEGIN");
	console.log(data);
    var finishNum = 0;
    var procNum = 2;

    for (var i = 1; i <= procNum; i++) {
        var User_unit_skill = mongoose.model('User_unit_skill');
        var user_unit_skill = new User_unit_skill();
        user_unit_skill['room_id'] = data['room_id'];
        user_unit_skill['team_id'] = data['team_id'];
        user_unit_skill['user_id'] = data['user_id'];
        user_unit_skill['user_unit_id'] = data['mst_unit']['mst_unit_id'];
        user_unit_skill['mst_skill_id'] = data['mst_unit']['mst_skill_id'+i];
        user_unit_skill['cooldown_end_time'] = new Date().getTime();
        user_unit_skill.save(function (err, user_unit_skill) {
            if (err) {
                console.log(err);
                return;
            }
            finishNum++;
            console.log("Complted for skill" + finishNum);
           //console.log(user_unit_skill);
            if (finishNum >= procNum && handler) {
                handler(data);
            }
        });
    }

}
//this function will run when user use unit skill
function UserUnitSkill_update(data, handler) {
	console.log("UserUnitSkill_update BEGIN");
	console.log(data);
	var User_unit_skill = mongoose.model('User_unit_skill');
	User_unit_skill.findOne({room_id : data['room_id'],user_id : data['user_id'], user_unit_id : data['unit_id'], mst_skill_id : []}, function (err, user_unit) {
		if(err || user_unit === null) { console.log(err); return;}

		user_unit.save(function(err, user_unit) {
		    console.log('User_unit updated ');
			if (handler) {
				handler(user_unit);
			};
		});
	});
}
//Check all player in room ready?
//return null if not
//return all player information in Room_user if all player ready
function Check_battle_start(data, handler) {
	//check all room user ready flag for start battle
	var repData = {};
	var Room_user = mongoose.model('Room_user');
	
	var User_unit = mongoose.model('User_unit');
	Room_user.find({room_id : data['room_id']}, function(err, rdata) {
		console.log('data in check battle');
		var room_user_units = [];
		var count = 0;
		for (var i = 0; i < rdata.length; i++) {
			if (rdata[i]['ready'] == 0) { return;};
			console.log("Rdata: "+ i + "__"+rdata[i]);
			User_unit.findOne({room_id : rdata[i]['room_id'],team_id : rdata[i]['team_id'], user_id : rdata[i]['user_id']}, function(err, rep) {
				if(err) {
					console.error(err);
				}
				room_user_units.push(rep);
				count++;
				if (count == rdata.length) {
					console.log("calling handler for start battle");
					if (handler && rdata.length > 1) {
						repData['room_user'] = rdata;
						repData['room_user_unit'] = room_user_units;
						handler(repData);
					};
				}
			});
		};
		
		

	});
}

function Battle_start(data, handler) {
	//Start Battle. Send to player the flag and selected units, skills data



}

//Battle End
function Battle_end(data, handler) {
	// console.log('Battle_end Clean battle data');
	// var Room_user = mongoose.model('Room_user');
	// var User_skill = mongoose.model('User_skill');
	// var User_unit = mongoose.model('User_unit');
	// var User_unit_skill = mongoose.model('User_unit_skill');

	// Room_user.remove({user_id : data['user_id'], room_id : data['room_id']},function(err, collection) {

	// 	if(err) {
	// 		console.log(err);
	// 		return;

	// 	}else {
	// 		console.log("Remove Room_user success");
	// 		console.log(collection);
	// 	}
	// 	User_skill.remove({user_id : data['user_id'], room_id : data['room_id']},function(err, collection) {
	// 		if(err) {
	// 		console.log(err);
	// 		return;

	// 		}else {
	// 			console.log("Remove User_skill success");
	// 			console.log(collection);
	// 		}
	// 		User_unit.remove({user_id : data['user_id'], room_id : data['room_id']},function(err, collection) {
	// 			if(err) {
	// 			console.log(err);
	// 			return;
	// 			}else {
	// 				console.log("Remove user_unit success");
	// 				console.log(collection);
	// 			}
	// 			User_unit_skill.remove({user_id : data['user_id'], room_id : data['room_id']}, function(err,collection) {
	// 				if (err) {
	// 					console.log(err);
	// 					return;
	// 				}else {
	// 					console.log("remove User_unit_skill success");
	// 				}
	// 				if (handler) {
	// 					handler(collection);
	// 				};
	// 			});

	// 		});
	// 	});
		
	// });
	removeRoomUserByUserData(data, function(temp) {
		removeUserSkillDataByUserData(data, function(temp) {
			removeUserUnitDataByUserData(data, function(temp) {
				if(handler) {
					handler(data);
				};
			});
		});
	});
}

//Battle Move
function Battle_move(data, handler) {
    console.log('Battle_move BEGIN');
    console.log(data);
    UserUnit_update(data, function (data) {
        console.log("return data");
        console.log(data);
        if (handler) {
            handler(data);
        };
    });
}

//Battle sync
function Battle_sync(data, handler) {
//TODO
//update data to table
//get newest data and send to client
//console.log(data);
console.log("-->Battle_sync BEGIN");
	var reData = {};
	reData['room'] = data['room_id'];
	var Room_user = mongoose.model('Room_user');
    Room_user.find( { room_id:data['room_id']/*, user_id:data['user_id'] */}, function(err,room_user){
           if(err || room_user=== null){ console.log(err); return; }
           reData['room_user'] = room_user;
           //console.log("reData");
           //console.log(reData);
           var User_skill = mongoose.model('User_skill');
			User_skill.find({user_id : data['user_id']}, function(err,user_skill) {
				if(err || user_skill=== null){ console.log(err); return; }
		           reData['user_skill'] = user_skill;
		           //console.log("reData");
		           //console.log(reData);
		            var User_unit_skill = mongoose.model('User_unit_skill');
		         	console.log("==================DATA:");
					User_unit_skill.find({user_id : data['user_id'],room_id : data['room_id'], user_unit_id : data['user_unit']['mst_unit_id'] }, function(err,user_unit_skills) {
						if (err /*|| user_unit_skills === null*/) { console.log(err); return;}
							reData['user_unit_skill'] = user_unit_skills;
							console.log("========================return data");
							console.log(user_unit_skills);
							var User_unit_status_aliment = mongoose.model('User_unit_status_aliment');
							User_unit_status_aliment.find({user_id : data['user_id'],room_id : data['room_id'],team_id : data['team_id']}, function(err,user_unit_status_aliment) {
								if (err/* || user_unit_status_aliment === null*/) { console.log(err); return;}
									reData['user_unit_status_aliment'] = user_unit_status_aliment;
									//console.log("return data");
									//console.log(reData);
									var User_unit_buffer = mongoose.model('User_unit_buffer');
									User_unit_buffer.find({room_id : data['room_id'], team_id : data['team_id'],user_id : data['user_id']},function(err,user_unit_buffer) {
										if (err /*|| user_unit_buffer === null*/) {console.log(err); return}
											reData['user_unit_buffer'] = user_unit_buffer;
											//console.log(reData);
											var Build = mongoose.model('Build');
											Build.find({},function(err,build) {
												if (err /*|| build === null*/) { console.log(err); return;}
												reData['build'] = build;
												//console.log(reData);
												var User_unit = mongoose.model('User_unit');
												User_unit.find({}, function(err,params) {
													if(err) {
														console.log(err); 
														return;
													}
													reData['user_unit'] = params;
													if(handler)   {
														handler(reData);
													}
												console.log('Battle_sync END');
												});
												
											});

									});
							});

					});
			});

    } );
}
//Battle Attack
function Battle_attack(data, handler) {
	console.log('Battle_attack BEGIN');
	console.log(data);
	if(handler) {
		handler(data);
	}

}
