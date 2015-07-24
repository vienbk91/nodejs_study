/*****************************
 * NodeJs Server for RTS Prototype
 * by Pham Chi Long
 * Bank Of Innovation Inc
******************************/

/**************************
 * Variables and modules
 **************************/
 
 require( './model_new.js' );
/*var http = require('http');
 


// 1.モジュールオブジェクトの初期化
var fs  = require("fs");
var sys = require ('sys'),
url  = require('url'),
http = require('http'),s
qs   = require('querystring');
*/
/**
 * Variable for save connected client socketId and client uuid
 */
var userHash = {}; // ユーザ管理ハッシュ
/**
 * Not use yet
 */
var roomHash = {}; // ルーム管理ハッシュ

var map = {};

// 2.イベントの定義
var server = require('http').Server();
var socketIO = require('socket.io');
var io = socketIO.listen(server);

/**************************************************************
 * Variables as CONSTANCE
 **************************************************************/
var room_id = 0;
var mapSize_w = 4200;
var mapSize_h = 2000;
var mapTitle_w = 68;
var mapTitle_h = 48;
var mapTitleSize_w = 60;
var mapTitleSize_h = 40;
 var neutralTowerPositions = [
	{x : 23 , y : 41},
	//{x : 46 , y : 41},
	//{x : 23 , y : 8},
	{x : 46 , y : 8},
	{x : 35 , y : 26}
 ];
 
 var cannonPosition = [
	 {x : 35, y : 40},
	 {x : 35, y : 10}
 ];

var blueTowerDelay = false;
var redTowerDelay = false;
var onClean = false;
var onBattleEnded = false;


/*******************************************************************
 * FUNCTIONS
 *******************************************************************/

removeOldData(function() {
	console.log("removed old data");
	//Put all bellow code inside here :)
});

/********************************
 * SocketIO functions for listen event from client
 ********************************/


/**
 * Client connect event
 */
io.sockets.on("connection", function (socket) {
	console.log("connect with socketId: "+ socket.id);
	
	socket.on('test', function(data) {
		socket.emit("json", data);
	});
	// 接続開始
	/**
	 * Handler for player select user event
	 * @param : data { userid, room_id, uuid}
	 * 
	 */
	
	socket.on("connect_begin", function (data) {
		console.log('EVENT:______________connect_begin');
		//console.log("RECEIVE DATA:");
		//console.log(data);
		var data = JSON.parse(data);
		room_id = data['room_id'];
		var user_id = data['user_id'];
		var uuid = data['uuid'];
	
		// ユーザー管理ハッシュに登録
		/**
		 * Save socketID for send data in old SocketIO version.
		 * In SocketIO v1.3.5 you can use socket.broadcast.emit
		 */
		userHash[uuid] = socket.id;
		//console.log("USER HASH:");
		//console.log(userHash);
		RoomUser_add( data, function(rdata){
			// 処理完了を通知
			BroadcastData(socket, "room_public_connect", function () {
				socket.emit("connect_begin_end", rdata);
			}, rdata);
		} );

	});
	/**
	 * Handler for reselect user
	 * This function was defined for process when player re-select user or may be when network re-connect
	 * When client reconnect to sever. All of data from before session will be delete
	 */
	socket.on('reconnect', function(data) {
		//console.log("Reconnect");
		//console.log(data);
		User_reselect(socket.id, function () {
			//console.log("Reconnect end");
		})
	});

	//  チーム選択
	/**
	 * Handler for select team event
	 * @param: data{user_id, room_id, team_id, uuid}
	 */
	socket.on('connect_select_team', function(data){
		//console.log('EVENT:______________connect_select_team');
		//console.log("RECEIVE DATA:");
		//console.log(data);
		var data = JSON.parse(data);

		// room_users を更新
		RoomUser_selectTeam( data, function(data){
			//  (Sample) チーム管理ハッシュに登録
			//teamHash[data['room_id']][data['team_id']][data['user_id']] = socket.id;
			//console.log("ROOM HASH:");
		    //console.log(roomHash);
		    RoomUser_updateState(data, 2, function (data) {
				BroadcastData(socket,"room_public_select_team_end", function() {
					socket.emit('connect_select_team_end', data);
				});
		    });
			// 処理完了を通知
			
		} );
		

	});

	//  ユニット選択
	/**
	 * Handler for select unit event
	 * @param data{
	 * 			user_id, 
	 * 			room_id, 
	 * 			team_id, 
	 * 			unit_id, 
	 * 			uuid, 
	 * 			mst_unit{mst_unit_id, hp_heal, hp, mp, mp_heal, attack, attack_range, attack_speed, defence, move_speed, element, mst_skill_id1, mst_skill_id2}}
	 */
	socket.on('connect_select_unit', function(data){

		//console.log('EVENT:______________connect_select_unit');
		//console.log(data);
		var data = JSON.parse(data);
	
		// user_units  を更新
		UserUnit_add( data, function(re_data){
			// 処理完了を通知
			BroadcastData(socket,'room_public_select_unit_end', function() {
				RoomUser_updateState(data, 3, function (data) {
		       	 	socket.emit('connect_select_unit_end', data);
				});
			}, data);
		});


	});
	
	/**
	 * Handler for user re-select unit.
	 */
	 socket.on("re_select_unit", function(data) {
		// console.log('Event: Re-select unit');
		 var data = JSON.parse(data);
		 removeUserUnitDataByUserData(data, function(redata) {
			 removeBattleResultDataByUuid(data['uuid'], function() {
				 socket.emit('re_select_unit_end', data);
			 });
			 
		 });
	 });

	// スキル選択
	/**
	 * Handlet for select player skill event
	 * 
	 * @param: 
	 * data {
	 * 	user_id,
	 * 	room_id,
	 *  team_id,
	 *  unit_id,
	 *  uuid,
	 *  player_skill_list[] 	
	 * }
	 */
	socket.on('connect_select_skill', function(data){

		//console.log('EVENT:______________connect_select_skill');
		//console.log("RECEIVE DATA:");
		//console.log(data);
		var data = JSON.parse(data);

		// user_skillsを更新
		UserSkill_add( data, function(redata){
			//emit selected event to all player in room.
			BroadcastData(socket, 'room_public_select_skill_end', function() {
				RoomUser_updateState(data, 4, function (data) {
		        	socket.emit('connect_select_skill_end', data);
		        });
			});		
		});

	});

	// 準備完了
	/**
	 * Handler event when user completed all prepare step and ready for join battle
	 * @param:
	 * data : same with skill_select
	 */
	socket.on('connect_ready', function(data){
		//console.log('EVENT:______________connect_ready');
		var data = JSON.parse(data);
	
		// room_users のステータスを更新
		RoomUser_updateReady(data, 1, function (rdata) {
		    socket.emit('connect_ready_end', rdata);
		    
			/**
			 * 全員分のreadyが揃ったら、全員に開始通知を送る 
			 * Check all unit state and send start message to all client
			 */
			Check_battle_start(data, function(data1) {
				console.log("All player ready. Sending start event");
				io.sockets.emit('room_public_battle_start',data1);
				Battle_start(data);
			});
		});

		// 処理完了を通知 - 使わないけど一応
	});
	/**
	 * handler for unit attack event
	 * @param:
	 * data {
	 * 		user_id,
	 * 		room_id,
	 *  	unit_id,
	 * 		team_id,
	 *  	user_unit{}, 	//attacker data
	 * 		target{},		//attack target
	 * 		uuid,
	 * 		direction
	 * }
	 */
	socket.on('attack',function(data) {
		console.log("Event: battle/attack");
		if(onClean == true) 
		{
			return console.log("battle ended");
		}
		var data = JSON.parse(data);
		//console.log(data);
		//incase of attack to tower
		if (data['target']['uuid'].toString() == 'redTower' || data['target']['uuid'].toString() == 'blueTower') {
			//Here is special case for tower. because they was't save in BD 
			Cacul_dame(data, function(dame) {
				data['dame'] = dame;
				//socket.emit("attack_end", data);
				//BroadcastData(socket, "attack", function(){}, data);
				ServerBroadcastData(io, "attack", data);
			});
			
		}
		else 
		{
			Battle_attack(data, function(rdata) {
				//BroadcastData(socket, "attack", function() {},data);
				//socket.emit("attack_end", data);
				ServerBroadcastData(io, "attack", data);
			});
		}
		
		
	});

	/**
	 * Handler for unit move event
	 * @param:
	 * data {
	 * 		user_id,
	 * 		room_id,
	 * 		direction,
	 * 		angle,
	 * 		position_x,
	 * 		position_y,
	 * 		status,
	 * 		moving,
	 * 		user_unit{},
	 * 		uuid
	 * }
	 * Now, This funtion user for sync all unit position between all client and server
	 * It not send anything to client. Just sync data
	 */
	socket.on('move',function(data) {
		var data = JSON.parse(data);
		if(onClean) {
			return console.log("Move: battle Ended");
		}
		Battle_move(data, function(data1) {
			//
		});
		
	});
	
	/**
	 * handler event for unit move end event
	 * @param:
	 * data {
	 * 		user_id,
	 * 		room_id,
	 * 		user_unit{},
	 * 		uuid
	 * }
	 * This function will change the state of user_unit.moving to true or false
	 * it also broadcast event and data to all client
	 */
	socket.on('move_end', function(data) {
		//console.log("==============================================================");
		//console.log("Event MoveEnd with data: "+ data);
		var data = JSON.parse(data);
		BroadcastData(socket,"unit_move_end", function () {
			//console.log("Completed broadcast data");
		},data);
	});

	/**
	 * Handler for unit dead event
	 */
	socket.on('dead', function(data) {
		//console.log("Event : Battle/DEAD")
		var data = JSON.parse(data);
		//check dead title map
		Map_checkUnitDead(data, function() {
			
		});
		Battle_dead(data, function(data) {
			//console.log("Unit Dead Compled");
			socket.emit("dead_end",data);
		});

	});

	/**
	 * Handler for respawn event
	 * Not using yet
	 */
	socket.on('respawn',function(data) {
		console.log("Event: ______________battle/respawn");
		//console.log("RECEIVE DATA: ");
		//console.log(data);
		var data = JSON.parse(data);

		//TODO

		socket.emit('respawn_end',{status: "ok"});
		//TODO
		//do something here

	});
	/************************************************
	 * Handler for skill event
	 * Receive data from one client and broadcast to all connected client
	*************************************************/
	socket.on('play_skill', function(data) {
		console.log("Skill event:==============================<<<");
		if(onClean) 
		{
			return console.log("battle ended");
		}
		var data = JSON.parse(data);
		console.log(data);
		/**
		 * testing 
		 */
		data['random']= randomIntFromInterval(85,100)/100;
		ServerBroadcastData(io, 'play_skill_end', data);
	});

	/**
	 * Handler for unit deal dame event for save battle information
	 */
	 socket.on("dame_deal", function(data) {
		 var data = JSON.parse(data);
		 BattleInfo_update(data, function(redata) {
			console.log("Battle infor update DAME completed"); 
		 });
	 });
	 
	 /**
	  * Handler for kill dead event for save battle information
	  */
	  socket.on("kill_unit", function(data) {
		  var data = JSON.parse(data);
		  BattleInfo_update(data, function(redata) {
			  console.log("Battle infor update KILL completed");
		  });
	  });
	  
	/**
	 * handler for testMoveLogic function. To save title status
	 * Then broadcast data to all client
	 */  
	 socket.on("get_title", function(data) {
		 //console.log("Event: GET TITLE");
		 if(onBattleEnded) return;
		 var data = JSON.parse(data);
		// map.data['pos_x'].data['pos_y'] = data['team_id'];
		//TODO SAVE DATA IN SERVER
		Map_check(data, function(redata) {
			data.disable = false;
			ServerBroadcastData(io,"set_title",data);
		});	 
	 });
	  
	  /**
	   * handler for check map status
	   */
	  socket.on("check_map", function(data) {
		  if(onBattleEnded) return;
		  Map_checkEnd(data, function(win_team) {
			  var redata = {};
			  redata['win_team_id'] = win_team;
			  clean_Interval();
			  ServerBroadcastData(io,"battle_public_battle_end",redata);
			  remove_Mapdata();
		  });
	  });
	  
	  /**
	   * handler for neutral tower attack event
	   */
	  socket.on("attack_neutral_tower", function(data) {
		 var data = JSON.parse(data);
		// console.log("Neutral tower attack");
		// console.log(data);
		 Neutral_tower_update(data, function(redata) {
			 BroadcastData(socket, "neutral_tower_attack",function() {
				 
			 },data);
			 socket.emit("attack_neutral_tower_end", data);
		 }) ;
	  });
	  
	  /**
	   * handler for neutral unit attack
	   */
	  socket.on("attack_neutral_unit", function(data) {
		  var data = JSON.parse(data);
		  
		  NeutralUnit_updateStatus(data, function(redata) {
			 BroadcastData(socket, "neutral_unit_attack", function() {}, data);
			 socket.emit('attack_neutral_unit_end', data); 
		  });
	  });
	  
	  /**
	   * Handler for cannon attack event
	   */
	   socket.on('attack_cannon', function(data) {
		  var data = JSON.parse(data);
		  
		  Cannon_update(data, function(redata) {
			  //broadcast
			  BroadcastData(socket, "attack_cannon", function() {},data);
			  socket.emit('attack_cannon_end', data);
			  //socket.emit
		  }) ;
	   });
	   
	   
	  /**
	   * Handler for cannon lunch event
	   */
	   socket.on('cannon_lunch', function(data) {
		   var data  = JSON.parse(data);
		   OnOff_Cannon(data, true, function() {
			   
			   socket.emit('cannon_lunch_end', data);
			   
			   setTimeout(function() {
				   OnOff_Cannon(data, false, function() {
				   });
			   },10000);
		   });
	   });
	   
	  
	  
	  /**
	   * Handler for warp event by wormhole
	   */
	   socket.on("warp_begin", function(data) {
		   var data = JSON.parse(data);		   
		   Wormhole_close(data, function(redata) {
			   //time out to open this hole after 5s
			   setTimeout(function() {
				   Wormhole_open(data, function() {
				   });
			   }, 5000);
			   //send hole close success to warp requested client
			   socket.emit("warp_begin_end", data);
		   });
		   
	   });
	   
	  /**
	   * handler for minions move event
	   */
	   socket.on("minion_move", function(data) {
		  var data = JSON.parse(data);
		  BroadcastData(socket,"minion_move",function() {},data);
		   
	   });
	  
	  
	  
	  
	/**
	 * Handler for battle end
	 * This function also check battle end data and send to client 
	 */
	socket.on('battle_end',function(data) {
		//console.log("Event: --------->battle/end<---------");
		//console.log("RECEIVE DATA: ");
		//console.log(data);
		var data = JSON.parse(data);
		clean_Interval();
		ServerBroadcastData(io,"battle_public_battle_end",data);
	});
	
	/**
	 * Handler for get battle result request
	 */
	socket.on('get_battle_result', function(data) {
		console.log('Received Get Battle Result Event');
		var Battle_info = mongoose.model('BattleInfo');
		Battle_info.find({}, function(err, redata) {
			if(err || redata == null) return console.error("Error when get battle result");
			socket.emit("battle_result", redata);
		});
	});

	/**
	 * Handler for clean battle result
	 */

	 socket.on('clean_battle_result', function(data) {
		 console.log(data);
		 if(!onClean) {
			 removeOldData(function() {
				 onClean = true;
			 });
		 }
		 
		 console.log('Battle result was clean!');
		 delete userHash[data];
		 console.log("#######USER HASH########");
		 console.log(userHash);
	 });
	 
	// 接続終了組み込みイベント(接続元ユーザを削除し、他ユーザへ通知)
	/**
	 * handler for player  disconnect event. Delete all player data and send event to all oher client
	 */
	socket.on("disconnect", function (data) {
		/*remove this for continue battle event one player disconnected */
		//clearInterval(updateInterval);
		//clearInterval(checkTowerAttackInterval);
		console.log('EVENT:disconnect ');
		console.log(socket.id);
		console.log(data);
		for (var key in userHash) {
			if(userHash[key] === socket.id) {
				delete userHash[key];
				if(isEmpty(userHash)) 
				{
					console.log("UserHash empty. All player disconnected");
					clean_Interval();
					removeOldData();
				}
				return;
			}
		}
		
		// TODO: 該当ユーザーのroom関連情報を全て削除、などの部屋制御を行う (Completed!);
	});

});
/**
 * Socket IO server listen on port
 */
server.listen('8222');
console.log('NodeJs v 1.3.5 Server  running on port 8222!');


var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
 * function to check an object is empty or not
 */
function isEmpty(obj)
{
	if(obj == null) return true;
	
	if(obj.length > 0) return false;
	if(obj.length === 0) return true;
	
	for (var key in obj) {
		if(hasOwnProperty.call(obj, key)) return false;
	}
	
	return true;
}


/**
 * When client disconnect. Remove all transaction data of disconnected user
 * emit to client new data list of room_user table
 */
function User_reselect(socketID, handler) {
	//console.log("socketID");
	//console.log(socketID);
	//console.log("User HASH: ");
	//console.log(userHash);
	for (var key in userHash) {
		////console.log(key);
		//console.log(userHash[key]);
		//console.log("===========");
		if(userHash[key] === socketID) {
			removeBattleResultDataByUuid(key, function() {
				removeRoomUserbyUUID(key, function(data) {
				//console.log("Remove Completed");
				//console.log(data);
				if(data) 
				{
					removeUserSkillDataByUserData(data, function(temp) 
						{
						removeUserUnitDataByUserData(data, function(temp) 
							{
							console.log("Remove all data when user disconnectd Completed");
							delete userHash[key];
							if (handler) 
							{
								handler();	
								return;
							};
						});
					});
				}
			});

			});
			
			return;
		}
	}
}

/**********************************************************************
 * REMOVE DATA FUNCTION
 **********************************************************************/
/***************************
 * For ease all old data when server start
 ***************************/
function removeOldData(handler) {
	removeAllBattleResult(function() {
	removeAllUserSkillData(function() {
		removeAllUserUnitSkillData(function() {
			removeAllUserUnitData(function() {
				removeAllRoomUserData(function() {
					remove_Mapdata(function() {
						remove_NeutralTowerData(function() {
							remove_WormholeData(function () {
								remove_NeutralUnitData(function() {
									remove_CannonData(function() {
										onBattleEnded = false;
										if(handler) {
											return handler();
										}
									});				
								});				
							});
						});			
					});
				});
			});
		});
	});
});
}


/**
 * remove roomUserData by uuid return data is data of remove user in room_user table
 */
function removeRoomUserbyUUID(uuid, handler) {
	console.log("UUID" +uuid);
	var Room_user = mongoose.model('Room_user');
	Room_user.findOne({room_user_id : uuid}, function(err,data) {
		//console.log("Data after remove removeRoomUserbyUUID: ");
		//console.log(data);
		//for return the data of disconnected user for next step (remove skill, unit...)
		Room_user.remove({room_user_id : uuid}, function(err) {
			if (err) { return console.log("Remove room user err");};
				if(handler) {
					handler(data);
				}			
		});
	});
	
}
/**
 * remove all data in Room_user collections
 */
function removeAllRoomUserData(handler) {
	var Room_user = mongoose.model('Room_user');
		Room_user.remove({}, function(err) {
			if (err) { return console.log("Remove all room_user error");};
				if(handler) {
					handler();
				}			
		});
}
/**
 * Remove user data from room_user by userdata
 */
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

/**
 * remove data from user_unit and User_unit_skills
 */
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

/**
 * Remnove all data of User_unit collection
 */
 function removeAllUserUnitData(handler) {
	 	var User_unit = mongoose.model('User_unit');
		 User_unit.remove({}, function(err) {
			if(err) return console.error("Error in remove all UserUnit");
			
			if(handler) {
				handler();
			} 
		 });
 }

/**
 * remove all data of User_unit_skill collections
 */
 function removeAllUserUnitSkillData(handler) {
	 var User_unit_skill = mongoose.model('User_unit_skill');
	 User_unit_skill.remove({}, function(err) {
		if(err) return console.log("Error when remove User_unit_skill data");
		
		if(handler) {
			handler();
		} 
	 });
 }

/**
 * Remove data from User skills (Player skill info) by user data
 */
function removeUserSkillDataByUserData(data, handler) {
	var User_skill = mongoose.model('User_skill');
	User_skill.remove({user_id : data['user_id'], room_id : data['room_id']},function(err) {
		if(err) {
			return console.log("remove user skill err");
		}
		if(handler) {
			return handler(data);
		}
	});

}
/**
 * Remove all data of User_skill collection
 */
 function removeAllUserSkillData(handler) {
	 var User_skill = mongoose.model('User_skill');
	 User_skill.remove({}, function(err) {
		 if(err) return console.error("Error in remove all User_Skill Data");
		 
		 if(handler) {
			 return handler();
		 }
	 })
 }

/**
 * Remove Battle result by player uuid
 */
 function removeBattleResultDataByUuid(uuid, handler) {
	 var BattleInfo = mongoose.model('BattleInfo');
	 BattleInfo.remove({uuid : uuid}, function(err) {
		if(err) return console.log("Remove battle info by uuid error");
		if(handler) {
			return handler();
		}
	 });
 }
 
 /**
 * Remove data in battle result
 */
 function removeAllBattleResult(handler) {
	 var BattleInfo =  mongoose.model('BattleInfo');
	 BattleInfo.remove({},function(err) {
		if(err) {
			return console.log("remove battleInfo err");
		}
		if(handler) {
			return handler();
		}
	})
 }
 
 /**
  * Remove all data in map schema
  */
  function remove_Mapdata(handler)
  {
	 	var map = mongoose.model("Map");
		 map.remove({}, function(err) {
			 if(err) {
				 return console.error("remove map data error");
			 }
			 if(handler)
			  {
				  return handler();
			  }
		 });
  }
 
 /**
  * remove all data in neutral_tower schema
  */
  function remove_NeutralTowerData(handler) 
  {
	  var tower = mongoose.model("Neutral_tower");
	  tower.remove({} , function(err) {
		 if(err) return console.error("remove neutral data errr"); 
		 if(handler) {
			 return handler();
		 }
	  });
  }
 
 /**
  * remove all WormHole schema data
  */
  function remove_WormholeData(handler)
  {
	  var hole = mongoose.model("Worm_hole");
	  hole.remove({}, function(err) {
		 if(err) return console.err("cannot remove hole data");
		 
		 if(handler) {
			 return handler();
		 } 
	  });
  }
 
 /**
  * remove all neutral Unit data
  */
  function remove_NeutralUnitData(handler) {
	  var unit = mongoose.model("Neutral_unit");
	  unit.remove({}, function(err) {
		 if(err) return console.err('cannnot remove neutral unit data');
		 if(handler) {
			 return handler();
		 } 
	  });
  }
 
 /**
  * remove all cannon data
  */
  function remove_CannonData(handler) {
	  var Cannon = mongoose.model('Cannon');
	  Cannon.remove({}, function(err) {
		 if(err) return console.error('Error when remove cannon data');
		 if(handler) {
			 return handler();
		 } 
	  });
  }
 
 /************************************************************************
  * SERVER SEND/ BROADCAST DATA FUNCTIONS
  ************************************************************************/

/**
 * New broadcast Data function for SockeIo\O 1.3.5
 * Send data to all another connected player
 */
function BroadcastData(socket, eventName, callbackHandler, data) {
	//console.log("Broadcast data: ");
	//console.log(data);
	socket.broadcast.emit(eventName, data);
	if(callbackHandler) {
		callbackHandler();
	}
}

/**
 * Server broadcast data to all client
 */
function ServerBroadcastData(io, eventName, data) {
	//console.log("Server broadcast data: " + eventName.toString());
	//console.log(data);
	io.sockets.emit(eventName, data);
}

/*************************************************************************
 * USER/UNIT/SKILL FUNCTIONS
 *************************************************************************/

// 以下機能関数群 > 後でクラスにまとめるかも

// room_users : 新規登録
/**
 * Add user data to room_user collections. Return value: All users in joined room
 */
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
		        return handler(result);
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
				return handler(data);
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
                           return handler(data);
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
                           return handler(data);
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
	//red team=id = 2
	if(data['team_id'] == 2) {
		//read team will be in upside and blue team is downside
		user_unit.position_x = mapSize_w - 100;
		user_unit.position_y = mapSize_h/2;
		user_unit.direction = 1;
		user_unit.angle = 0;
	}else {
		//blue team_id = 1
		user_unit.position_x = 100;
		user_unit.position_y = mapSize_h/2;
		user_unit.direction = 1;
		user_unit.angle = 0;
	}
	
	user_unit.hp = data['mst_unit']['hp'];
	user_unit.mp = data['mst_unit']['mp'];
	user_unit.status = 1;
	user_unit.uuid = data['uuid'];
	user_unit.moving = false;
	user_unit.attack = data['mst_unit']['attack'];
	user_unit.defence = data['mst_unit']['defence'];
	user_unit.element = data['mst_unit']['element'];
	/**
	 * save unit data
	 */
	user_unit.save(function(err,user_unit) {

		if (err) { console.log(err); return; }
		//console.log(user_unit);
		/**
		 * save unit skill data
		 */
		UserUnitSkill_add(data, function(redata) {
			console.log("UserUnitSkill_add END");
			/**
			 * save data into battle info for battle result
			 */
			BattleInfo_add(data, function(redata) {
				if (handler) {
					//return user_unit for client have unique id = collection index
			    	return handler(user_unit);
			}
			});
		});		
	});
	
}

//user_unit update by battle sync and battle move
function UserUnit_update(data, handler) {
    var User_unit = mongoose.model('User_unit');
    //console.log("UserUnit update BEGIN");
	User_unit.findOne({room_id : data['room_id'],user_id : data['user_id'], mst_unit_id : data['user_unit']['mst_unit_id']}, function (err, user_unit) {
		if(err || user_unit === null) { console.log(err); return;}
		/**
		 * update unit stats
		 */
		user_unit.hp = data['user_unit']['hp'];
		user_unit.mp = data['user_unit']['mp'];
		user_unit.attack = data['user_unit']['attack'];
		user_unit.defence = data['user_unit']['defence'];
		user_unit.element = data['user_unit']['element'];
		
		user_unit.position_x = data['position_x'];
		user_unit.position_y = data['position_y'];
		user_unit.direction = data['direction'];
		//TODO change angle, uuid, moving
		user_unit.status = data['status'];
		user_unit.angle = data['angle'];
		user_unit.uuid = data['uuid'];
		user_unit.moving = data['moving'];
		user_unit.save(function(err, user_unit) {
		   // console.log('User_unit updated ');
			if (handler) {
				return handler(user_unit);
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
            	   return handler(user_skill);
            	}
    	});
	}

}

//user_unit_skills
function UserUnitSkill_add(data, handler) {
	//console.log("UserUnitSkill_add BEGIN");
	//console.log(data);
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
                return handler(data);
            }
        });
    }

}
//this function will run when user use unit skill
function UserUnitSkill_update(data, handler) {
	//console.log(data);
	var User_unit_skill = mongoose.model('User_unit_skill');
	User_unit_skill.findOne({room_id : data['room_id'],user_id : data['user_id'], user_unit_id : data['unit_id'], mst_skill_id : []}, function (err, user_unit) {
		if(err || user_unit === null) { console.log(err); return;}

		user_unit.save(function(err, user_unit) {
		    console.log('User_unit updated ');
			if (handler) {
				return handler(user_unit);
			};
		});
	});
}

/**
 * Initial data for save battle informations
 * 
 */
function BattleInfo_add(data, handler) {
	//console.log("Battle Infor add: ");
	//console.log(data);
	var Batttle_Info = mongoose.model('BattleInfo');
	var battle_info = new Batttle_Info();
	battle_info.room_id = data["room_id"];
	battle_info.team_id = data["team_id"];
	battle_info.user_id = data["user_id"];
	battle_info.unit_id = data["unit_id"];
	battle_info.uuid = data["uuid"];
	battle_info.killNum = 0;
	battle_info.deadNum = 0;
	battle_info.assistNum = 0;
	battle_info.longestKillStreak = 0;
	battle_info.maxKillCombo = 0;
	battle_info.totalDealDame = 0;
	battle_info.totalReceiveDame = 0;
	battle_info.save(function(err, redata) {
		if(err) return console.error(err);
		if(handler) {
			return handler(data);
		}
	});
}

/**
 * Update battle information
 */
function BattleInfo_update(data, handler) {
	var Battle_info = mongoose.model('BattleInfo');
	Battle_info.findOne({uuid : data['uuid']}, function(err, battle_info) {
		if(err || battle_info ==null) return console.log("Find killer infor error____________________________________");
		if(data['dame']) {
			battle_info.totalDealDame += data['dame'];
			//console.log("DAME");
		}
		if(data['kill']) {
			battle_info.killNum += 1;
			//console.log(" KIll NUM");
		}
		/*More for combo and assist */
		
		battle_info.save(function(err, redata) {
			if(err) return console.log(err);
			Battle_info.findOne({uuid : data['target']}, function(er, target) {
				if(err || target == null) 
				{
					if(battle_info.deadNum >=5 || ((data['target'].toString() =="redTower" || data['target'].toString() == "blueTower") && data['kill'] != null)) {
						clean_Interval();
						if(data['target'].toString() =="redTower")
							{
								data['win_team_id'] = 1;
							}
							else {
								if (data['target'].toString() == 'blueTower') {
									data['win_team_id'] = 2;
								}
								else {
									data['win_team_id'] = battle_info.team_id;
								}
							}
						ServerBroadcastData(io,"battle_public_battle_end",data);

						return console.log("Tower dead");
					}
					return console.log("Find target infor error___________________________________");
				
				}
				if(data['dame']) {
					target.totalReceiveDame += data['dame'];
					//console.log("RECEIVED DAME");
				}
				if(data['kill']) {
					target.deadNum += 1;
					//console.log("DEAD");
				}
				target.save(function(err, ret) {
					if(err) return console.log(err);
					// Check Battle end condition
					if(target.deadNum >=5) {
						data['win_team_id'] = battle_info.team_id;
						clean_Interval();
						ServerBroadcastData(io,"battle_public_battle_end",data);
						return;
					}
					//Else reset dead unit position
					/*var User_unit = mongoose.model('User_unit');
					User_unit.findOne({uuid : data['target']}, function(err, unit) {
						if(err || unit == null) {
							//call callback when find target unit error
							if(handler) {
								return handler(data);
							}
						}
						if(unit.team_id == 2) {
						//read team will be in right side and blue team in left side
							unit.position_x = mapSize_w - 100;
							unit.position_y = mapSize_h/2;
							unit.direction = 2;
							unit.angle = -90;
						}else {
							//blue team_id = 1
							unit.position_x = 100;
							unit.position_y = mapSize_h/2;
							unit.direction = 8;
							unit.angle = 0;
						}
						//save position and call callback
						unit.save(function(err, data) {*/
							if (handler) {
								return handler(data);
							};
						/*});
						
					});*/
				});
			});
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
						return handler(repData);
					};
				}
			});
		};
		
		

	});
}


/**********************************************************************
 * BATTLE REAL TIME FUNCTIONS
 *********************************************************************/

var updateInterval;
var checkTowerAttackInterval;
var neutralUnitMoveInterval;
var timeStep = 50; //Interval time
var neutral_move_timeout = 1000;


/**
 * This function was called when battle started. It will start 2 interval funtion to sync all unit data (updateInterval)
 * and other one to check tower auto attack
 */
function Battle_start(data) {
	//Start Battle. Send to player the flag and selected units, skills data 20times on each seconds
	//console.log("Data aftet Battle Start: "+ data);
	room_id = data['room_id'];
	redTowerDelay = false;
	blueTowerDelay = false;
	onBattleEnded = false;
	onClean = false;
	
	Neutral_tower_add(0,function() {
		Neutral_tower_add(1, function() {
			Neutral_tower_add(2, function() {
				/*Neutral_tower_add(3, function() {
					Neutral_tower_add(4, function() {*/
						Wormhole_add(0, function() {
							Wormhole_add(1, function() {
								/*Wormhole_add(2, function() {
									Wormhole_add(3, function() {*/
										NeutralUnit_add(0, function() {
											NeutralUnit_add(1, function() {
												Cannon_add(0, function () {
													Cannon_add(1,function() {
														//call function every 50 mini second (as 20 time per second);
														updateInterval = setInterval(Battle_scheduleUpdate, timeStep);
													
														checkTowerAttackInterval = setInterval(Check_TowerAutoAttack, timeStep);
														
														neutralUnitMoveInterval = setInterval(neutralMoveFunction,neutral_move_timeout);
														setTimeout(function() {
															Map_checkEnd(data, function(win_team) {
																  var redata = {};
																  redata['win_team_id'] = win_team;
																  clean_Interval();
																  ServerBroadcastData(io,"battle_public_battle_end",redata);
																  remove_Mapdata();
															  });
															
														},120000);
													});
												});
												
											});
										});
									/*});
								});*/
							});
						});
						
					/*});
				});*/
			});
		});
		
	});
	
	
}


/**
 * This function was call when battle ended. It for clear all action interval
 */
function Battle_end(data, handler) {
	clean_Interval();
}
/**
 * Clean battle interval
 */

function clean_Interval() {
	onBattleEnded = true;
	//Clean update move interval
	clearInterval(updateInterval);
	//Clear check tower attack interval
	clearInterval(checkTowerAttackInterval);
	
	clearInterval(neutralUnitMoveInterval);
}

//Battle Move
function Battle_move(data, handler) {
   /* console.log('Battle_move BEGIN');
    console.log(data);*/
    UserUnit_update(data, function (data) {
        /*console.log("return data");
        console.log(data);*/
        if (handler) {
            return handler(data);
        };
    });
}
/**
 * Funtion to send updated data to all client on every second
 */
function Battle_scheduleUpdate() {
	queryAllCollectData(function(data) {
		io.sockets.emit("battle_update", data);
	});
}

/**
 * Red team id = 2; Blue team id = 1;
 */

/**
 * Function to check tower auto attack and send event to all client 
 */

function Check_TowerAutoAttack() {
	if(!blueTowerDelay) {
		/*blue tower attack check */
		checker(200, mapSize_h/2, 2 , function(uuid) {
			var reData = {};
			reData['tower'] = "blueTower";
			reData['target'] = uuid;
			reData['team_id'] = 1;
			reData['rand_num'] = randomIntFromInterval(85,100) / 100;
			io.sockets.emit("tower_attack", reData);
			console.log('SEND BLUE TOWER ATTACK EVENT');
		});
	}
	if(!redTowerDelay) {
		/**red tower attack check */
		checker(mapSize_w-200, mapSize_h/2, 1,function(uuid) {
			var redata = {};
			redata['tower'] = "redTower";
			redata['target'] = uuid;
			redata['team_id'] = 2;
			redata['rand_num'] = randomIntFromInterval(85,100)/100;
			io.sockets.emit("tower_attack", redata);
			console.log("SEND RED TOWER ATTACK EVENT");
		});
	}
}


/**
 * function to creae neutral unit move logic
 */
 function neutralMoveFunction() {
	 var NeutralUnit = mongoose.model('Neutral_unit');
	 NeutralUnit.find({}, function(err, data) {
		 if(err || data.length == 0) {
			 return console.error("Neutral move interval: neutral unit not found");
		 }
		 for (var index = 0; index < data.length; index++) {
			 var element = data[index];
			 //random new move offset
			 var ranx = Math.round(randomIntFromInterval(-1,1));
			 var rany = Math.round(randomIntFromInterval(-1,1));
			 var newPos_x = element.pos_x + ranx;
			 var newPos_y = element.pos_y + rany;
			 //because client layer title index begin from 1-> 68 and 1->48
			 if(newPos_x < 1 || newPos_x >= mapTitle_w || newPos_y < 1 || newPos_y >= mapTitle_h || newPos_x + newPos_y <=10 || newPos_x + newPos_y >107 || newPos_y - newPos_x >38 || newPos_x - newPos_y > 58) {
				 console.error("bad position");
				 continue;
			 }
			 //broadcast to all client
			 var redata = {};
			 redata['index'] = element.index;
			 redata['pos_x'] = element.pos_x;
			 redata['pos_y'] = element.pos_y;
			 redata['new_x'] = newPos_x;
			 redata['new_y'] = newPos_y;
			 //console.log(redata);
			 ServerBroadcastData(io,"neutral_move", redata);
			 element.pos_x = newPos_x;
			 element.pos_y = newPos_y;
			 element.save(function(err, unit) {
				 if(unit.team_status != 0) {
					//console.log("update map");
					var sendData = {};
					sendData['team_id'] = unit.team_status;
					//caculate title coor
					sendData['pos_x'] = unit.pos_x;
					sendData['pos_y'] = unit.pos_y;
					sendData['disable'] = false;
					Map_check(sendData, function(notuse) {
						ServerBroadcastData(io,"set_title",sendData);
					});
				}	 
			 });			 		 
		 }
	 });
	 
	 
 }



var towerAttackDelayTime = 5000;
/**
 * checker for auto attack with tower position;
 */
function checker(pos_x, pos_y, team_id, handler) {
	var Unit = mongoose.model('User_unit');
	Unit.find({team_id : team_id}, function(err, data) {
		for (var index = 0; index < data.length; index++) {
			var element = data[index];
			var unit_x = element.position_x;
			var unit_y = element.position_y;
			/**
			 * Unit Status: 1:通常　2:死亡中　3:帰陣中　
			 */
			if(Math.sqrt((unit_x - pos_x)*(unit_x - pos_x) + (unit_y - pos_y)*(unit_y - pos_y)) < 200 && element.status != 2) {
				// BLUE TOWER
				if(pos_x < mapSize_w/2) {
					blueTowerDelay = true;
					setTimeout(function() {
						blueTowerDelay = false;
					}, towerAttackDelayTime);
				}else {
					//RED TOWER
					redTowerDelay = true;
					setTimeout(function() {
						redTowerDelay = false;
					}, towerAttackDelayTime);
				}
				
				if(handler) {
					return handler(element.uuid);
				}
			}
		}
	});
}

/**
 * Logic for attack
 */
function Battle_attack(data, handler) {
	//console.log("Data in battle attack: ");
	//console.log(data);
	Cacul_dame(data, function(dame) {
		data['dame'] = dame;
		console.log(data['dame']);
	
		//update current HP of target and save battle info
		var User_unit = mongoose.model('User_unit');
		User_unit.findOne({uuid : data['target']['uuid']}, function(err, target) {
			if(err) {
				return console.error("Battle attack error : "+err);
			}
			//in case of Tower
			if(target == null) {
				if(handler) {
					return handler(data);
				}
			}
			//TODO in future. Dame deal will caculate at server and send to all client
			
			target.hp = data['target']['hp'];
			target.save(function(err,redata) {
				if(handler) {
					return handler(data);
				}
			});
			//TODO save kill dead.
			
			
		});
	});
}
/**
 * Calculate attack dame base on attacker dame and target defence.
 * dame = (attacker.dame - target.defence)*(element value) * (dame_rate between 0.85~1.0)
 */
function Cacul_dame(data, handler) {
	getUserUnitInfoByUuid(data['user_unit'], function(attacker) {
		 getUserUnitInfoByUuid(data['target'], function(target) {
			 var rate = 0;
			 if(attacker.element ==4 || target.element == 4) {
				 rate = 1;
			 }else {
				if(attacker.element - target.element == -1 || attacker.element - target.element == 2) {
					rate = 1.5;
				}else {
					rate = 0.5;
				}
			 }
			 if(handler) {
				 return handler(Math.round((attacker.attack - target.defence)*rate*randomIntFromInterval(85,100)/100));
			 } 
		 });
	});
}

/**
 * Get unit information base on unit uuid
 */
function getUserUnitInfoByUuid(data, handler) {
	var User_unit = mongoose.model('User_unit');
	User_unit.findOne({uuid : data['uuid']}, function(err, redata) {
		if(err) {
			return console.error("Error when find unit by uuid");	
		}
		if(redata == null) {
			console.log("Tower");
			if(handler) {
				return handler(data);
			}
		}
		console.log("find success");
		if(handler) {
			return handler(redata);
		}
	});
}
/**
 * random value between min ~ max
 */
function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

/**
 * Logic for unit dead
 * reset unit position
 * reset unit move direction an rotate angle
 */
function Battle_dead(data, handler) {
	var User_unit = mongoose.model('User_unit');
	User_unit.findOne({room_id : data['room_id'], user_id : data['user_id'], team_id : data['team_id']}, function(err,rdata) {
		if (err) {
			return console.error("Battle dead find error: "+err);
		}
		//BLUE TEAM ID 1
		//RED TEAM ID 2
		if(data['team_id'] == 2) {
		//read team will be in upside and blue team is downside
			rdata.position_x = mapSize_w - 100;
			rdata.position_y = mapSize_h/2;
			rdata.direction = 2;
			rdata.angle = -90;
		}else {
			//blue team_id = 1
			rdata.position_x = 100;
			rdata.position_y = mapSize_h/2;
			rdata.direction = 8;
			rdata.angle = 0;
		}
		
		rdata.save(function(err, data) {
		    console.log('User_unit DEAD updated ');
			if (handler) {
				return handler(data);
			};
		});
	
		
	});
}

/**
 * function for querry all data in collections
 */
function queryAllCollectData(handler) {
	var reData = {};
	var roomId = room_id;
	/*var Room_user = mongoose.model('Room_user');
	Room_user.find( { room_id:roomId }, function(err,room_user){
		if(err) {
			 return console.error(err);
		}
		reData['room_user'] = room_user;
		var User_skill = mongoose.model('User_skill');
		User_skill.find({room_id :roomId }, function(err,user_skill) {
			if(err) {
				return console.error(err);
			}
			reData['user_skill'] = user_skill;*/
			var User_unit = mongoose.model('User_unit');
				User_unit.find({room_id : roomId}, function(err,params) {
					if(err) {
						console.error(err); 
						return;
					}
					reData['user_unit'] = params;
					/*var Build = mongoose.model('Build');
					Build.find({}, function(err, data) {
						if(err) {
							return console.error(err);
						}
						reData['Build'] = data;*/
						/*console.log("Battle Schedule update data: ");	
						console.log(reData);*/
						if(handler) {
							return handler(reData);
						}
					/*});*/
				});
		/*});
	});*/
}





/**
 * find 4 title nearly unit dead position. Change color to team color and diasble this title
 */
function Map_checkUnitDead(data, handler) 
{
	var team_id = 0;
	if(data.team_id == 1) {
		team_id =2;
	}else {
		team_id = 1;
	}
	
	console.log("check at : " + data.dead_x + " - " + data.dead_y);
	
	for (var x = data.dead_x -1; x <= data.dead_x; x++) {
		for (var y = data.dead_y; y <= data.dead_y+1; y++) {
			Map_checkDeadTitle(x, y, team_id, function(value, x1, y1) {
				if(value) {
					var sendData = {};
					sendData.team_id = team_id;
					sendData.pos_x = x1;
					sendData.pos_y = y1;
					sendData.disable = true;
					ServerBroadcastData(io,"set_title",sendData);
					console.log("send disable title" + x1 +" - "+ y1);
				}
			});
			
		}
		
	}
} 
 
 
function Map_checkDeadTitle(x, y, team_id, handler) 
{
	console.log("check title : " + x + "/" + y);
	var checkData = {};
	checkData.pos_x = x;
	checkData.pos_y = y;
	checkTitleNearSpecialObject(checkData, neutralTowerPositions, 8,  function(value) {
		if(value) return handler(false);
		checkTitleNearSpecialObject(checkData, cannonPosition, 4, function(value2) {
			if(value2) return handler(false);
			var Map = mongoose.model('Map');
			Map.findOne({x : x, y : y}, function(err, title) {
				if(err) return console.error("Find title error 1836");
				if(!title) {
					var newTitle = new Map();
					newTitle.x = x;
					newTitle.y = y;
					newTitle.color = team_id;
					newTitle.disable = true;
					newTitle.save(function(err, redata) {
						if(err) return console.error("add new disable title error 1844");
						
						if(handler) {
							return handler(true , x, y);
						}
					});
				}
				else 
				{
					if(title.disable) {
						return handler(false);
					}
					title.disable = true;
					title.color = team_id;
					title.save(function(err, redata) {
						 if(err) {
							 return console.error('change disable title error 1860');
						 }
						 if(handler) {
							 return handler(true, x, y);
						 }
					 });
				}			
			});
		});
	});
}


/**
 * Function to check/save map status
 */
 function Map_check(data, handler) {
	 //it also was checked in client but we check it one again
	 checkTitleNearSpecialObject(data, neutralTowerPositions, 8, function(value) {
		 if(value) return /*console.log("title near tower")*/;
		 checkTitleNearSpecialObject(data, cannonPosition, 4, function(value2) {
			if(value2) return;
			 var Map = mongoose.model("Map");
			 Map.findOne({x : data['pos_x'], y : data['pos_y']}, function(err, result) {
				 if(err) {
					 return console.error("Query data of Map Schema error");
				 }
				 //console.log(result);
				 /** In case of new title */
				 if(!result) 
				 {
					 var newData = new Map();
					 newData.x = data['pos_x'];
					 newData.y = data['pos_y'];
					 newData.color = data['team_id'];
					 newData.disable = false;
					 newData.save(function(err, redata) {
						if(err) {
							return console.error('save new map data error');
						} 
						if(handler) {
							return handler(data);
						}
					 });
				 }
				 /** In case of title that was got before */
				 else 
				 {
					 if(result.disable) {
						 return console.error("unit dead title cant be change color");
					 }
					 result.color = data['team_id'];
					 result.save(function(err, redata) {
						 if(err) {
							 return console.error('renew map data error');
						 }
						 if(handler) {
							 return handler();
						 }
					 });
				 }	 
			 });	 		 
		 });
	 });
 }

 
 /**
  * Check title that it near tower or not
  */
  function checkTitleNearSpecialObject(data, objectArray, offset, handler) 
  {
	  var x = data['pos_x'];
	  var y = data['pos_y'] - 1;
	  for (var index = 0; index < objectArray.length; index++) {
		  var element = objectArray[index];
		  if(x >= element.x - offset/2 && x < element.x + offset/2 && y >=element.y - offset/2 && y < element.y + offset/2) {
			  return handler(true);
		  }
	  }
	  return handler(false);
  }
 

/**
 * Check the map status in data and return the id of win team
 */
 function Map_checkEnd(data, handler) 
 {
	 var Map = mongoose.model("Map");
	 var NeutralTower = mongoose.model("Neutral_tower");
	 var Cannon = mongoose.model('Cannon');
	 //find number of blue title in map that not contain title inside towers area and cannons area
	 Map.find({color : 1}, function(err, blueTeam) {
		 NeutralTower.find({team_status : 1}, function(err, blueTower) {
			 Cannon.find({team_status : 1}, function(err, blueCannon) {
				 Map.find({color : 2}, function(err, redTeam) {
					 NeutralTower.find({team_status : 2}, function(err, redTower) {
						 Cannon.find({team_status : 2}, function(err, redCannon) {
							 if (blueTeam.length + blueTower.length * 36 + blueCannon.length*16 > redTeam.length + redTower.length * 36 + redCannon.length * 16) {
								 return handler(1);
							 }
							 else {
								 return handler(2);
							 }
						 });
					 });
			 	});
			 });
		 });
	});
 }
 
/************************************************************************
 * NEUTRAL TOWER LOGIC FUNCTIONS
 ************************************************************************/
  
  /**
   * add new  neutral tower
   */
  function Neutral_tower_add(index, handler) 
  {
	  var Neutral_tower = mongoose.model('Neutral_tower');
	  var neutral_tower = new Neutral_tower();
	  neutral_tower.index = index;
	  neutral_tower.team_status = 0;
	  neutral_tower.red_attack = 0;
	  neutral_tower.blue_attack = 0;
	  neutral_tower.save(function(err, redata) {
		 if(err) return console.log("Error when create neutral tower data"); 
		 if(handler) {
			 return handler();
		 }
	  });
  }
  
  /**
   * update neutral tower data
   */
   function Neutral_tower_update(data, handler)
   {
	   var Neutral_tower = mongoose.model('Neutral_tower');
	   Neutral_tower.findOne({index : data.index}, function(err, tower) {
		   if(err || tower == null) {
			   console.error("tower data not found");
			   if(handler) {
				   return handler();
			   }
		   }
		   if(data.team_id == tower.team_status) {
			   if(handler) {
				   return handler();
			   }
		   }
		   if(data.team_id == 1) {
			   tower.blue_attack += 1;
			   if(tower.red_attack > 0) {
				   tower.red_attack -= 1;
			   }
			   if(tower.blue_attack == 5) {
				   if(tower.team_status == 0)
				    {
						tower.team_status = 1;
				  	 	//send change tower event
				   		Send_neutralStatusChangeEvent(tower.index, 1, function() {
					  	 //
				   		});
					}else {
						
						tower.team_status = 0;
						tower.blue_attack = 0;
						Send_neutralStatusChangeEvent(tower.index,0, function() {
						   
					   });
					}
			   }			   
		   }else {
			   tower.red_attack += 1;
			   if(tower.blue_attack > 0) {
				   tower.blue_attack -=1;
			   }
			   if(tower.red_attack == 5) {
				   
				   if(tower.team_status ==0)
				   {
					   tower.team_status = 2;
				  	 //send change tower event
				 	  Send_neutralStatusChangeEvent(tower.index, 2, function() {
					 	//
				   		});
				   }else {
					   tower.team_status = 0;
					   tower.red_attack = 0;
					   Send_neutralStatusChangeEvent(tower.index,0, function() {
						   
					   });
				   }
			   };
		   }
		   //save change to database   
		   tower.save(function(err, rdata) {
				   if(handler) {
					   return handler(rdata);
				   }
			   });
		   
	   });
   }
   
   /**
	* send neutral tower change stage event
    */
	function Send_neutralStatusChangeEvent(index, teamId, handler)
	{
		var data = {};
		data.index = index;
		data.team_id = teamId;
		setTimeout(function() {
			ServerBroadcastData(io,"neutral_status_change", data);
			
		},500);
		
		if(handler) {
			return handler();
		}
	}
	
	/*************************************************************************
	 * WORMHOLE LOGIC FUNCTION
	 ************************************************************************/
	 
	 /**
	  * Create 4 wormhole data in schema
	  */
	  function Wormhole_add(index, handler) {
		  var WormHole = mongoose.model('Worm_hole');
		  var worm_hole = new WormHole();
		  worm_hole.index = index;
		  worm_hole.status = 1;
		  worm_hole.save(function(err, redata) {
			 if(err) return console.log("Error when create wormhole data"); 
			 if(handler) {
				 return handler();
			 }
		  });
	  }
	  
	 /**
	  * close worm hold status function
	  */
	  function Wormhole_close(data, handler )
	  {
		  //update status for in gate
		  Wormhole_update(data.index,0, function(redata) {
			  //update status for out gate
			  Wormhole_update(data.outgate,0, function(params) {
				  Send_wormholeStatusChangeEvent(data,0,function() {
					  if(handler) {
					 	  return handler(redata);
				  		}
				  });
			  });
		  });
	  }
	  
	  
	  /**
	   * open wormhole
	   */
	   function Wormhole_open(data, handler) 
	   {
		  Wormhole_update(data.index, 1, function(params) {
			  Wormhole_update(data.outgate, 1, function(redata) {
				  Send_wormholeStatusChangeEvent(data, 1, function() {
					  if(handler) {
						  return handler(data);
					  }
				  });
			  });
		  });
	   }
	  /**
	   * update gate status
	   */
	  function Wormhole_update(index, status, handler) 
	  {
		   var WormHole = mongoose.model('Worm_hole');
		   WormHole.findOne({index : index}, function(err, hole) {
			   if(err || hole == null) {
				   console.error("hole update fail");
				   if (handler) {
					    return handler();
				   }
			   }
			   hole.status = status;
			   hole.save(function(err, redata) {
					if(handler) {
						return handler(redata);
					}
			   });
		  });
	  }
	  
	  
	  /**
	   * Function to send worm hole status change
	   */
	   function Send_wormholeStatusChangeEvent(data, status, handler) 
	   {
		   data.status = status;
		   ServerBroadcastData(io, "wormhole_status_change", data);
		   if(handler) {
			   return handler();
		   }
	   }
	   
	/*************************************************************************
	 * NEUTRAL UNIT FUNCTION
	 ************************************************************************/
	
	/**
	 * Add new neutral unit
	 */
	
	function NeutralUnit_add(index, handler)
	{
		var NeutralUnit = mongoose.model('Neutral_unit');
		  var unit = new NeutralUnit();
		  unit.index = index;
		  unit.team_status = 0;
		  unit.red_attack = 0;
		  unit.blue_attack = 0;
		  unit.pos_x = mapTitle_w/2;
		  unit.pos_y = 8 + (index * (mapTitle_h - 16));
		  unit.direction = 2;
		  unit.save(function(err, redata) {
			 if(err) return console.log("Error when create neutral unit data"); 
			 if(handler) {
				 return handler();
			 }
		  });
	}
	
	/**
	 * update neutral unit
	 */
	 function NeutralUnit_updateStatus(data, handler)
	 {
		 var NeutralUnit = mongoose.model('Neutral_unit');
		 NeutralUnit.findOne({index : data.index}, function(err, unit) {
			if(err || unit == null) {
				console.log("FIND NEUTRAL UNIT FAILD");
				if(handler) {
					return handler();
				}
			}
			//unit same team with update resuest
			if(data.team_id == unit.team_status) {
				if(handler) {
					return handler();
				}
			}
			if(data.team_id == 1) {
				unit.blue_attack +=1;
				if(unit.red_attack > 0) {
					unit.red_attack -=1;
				}
				if(unit.blue_attack == 5) 
				{
					if(unit.team_status == 0 ) {
						unit.team_status = 1;
						//send unit change event (to blue team)
					}
					else
					{
						unit.team_status = 0;
						unit.blue_attack = 0
						//send unit change event (to neutral)
					}
				}
			}
			else 
			{
				unit.red_attack += 1;
				if(unit.blue_attack > 0) {
					unit.blue_attack -= 1;
				}
				if(unit.red_attack == 5)
				{
					if(unit.team_status == 0) 
					{
						unit.team_status = 2;
						//send unit change event (to red team)
					}
					else
					{
						unit.team_status = 0;
						unit.red_attack = 0;
						//send unit change event ( to neutral)
					}
				}
			}
			Send_neutralUnitStatusChange(unit.index,unit.team_status,function() {
						
			});
			
			unit.save(function(err, rdata) {
				if(handler) {
					return handler();
				}
			});
			
		 });
	 }
	 
	 /**
	  * send neutral unit Status change
	  */	
	 function Send_neutralUnitStatusChange(index, teamid, handler) 
	 {
		 var data = {};
		 data.index = index;
		 data.team_id = teamid;
		 setTimeout(function() {
			 ServerBroadcastData(io, 'neutral_unit_status_change',data);
		 },500);
		 if(handler)
		 {
			 handler();
		 }
	 }
	 
	 /****************************************************************************
	  * CANNON FUNCTIONS
	  ***************************************************************************/
	 /**
   * add new  neutral tower
   */
  function Cannon_add(index, handler) 
  {
	  var Cannon = mongoose.model('Cannon');
	  var cannon = new Cannon();
	  cannon.index = index;
	  cannon.team_status = 0;
	  cannon.red_attack = 0;
	  cannon.blue_attack = 0;
	  cannon.disable = false;
	  cannon.save(function(err, redata) {
		 if(err) return console.log("Error when create cannon data"); 
		 if(handler) {
			 return handler();
		 }
	  });
  }
  
  /**
   * update neutral tower data
   */
   function Cannon_update(data, handler)
   {
	   var Cannon = mongoose.model('Cannon');
	   Cannon.findOne({index : data.index}, function(err, cannon) {
		   if(err || cannon == null) {
			   console.error("cannon data not found");
			   if(handler) {
				   return handler();
			   }
		   }
		   if(data.team_id == cannon.team_status) {
			   if(handler) {
				   return handler();
			   }
		   }
		   if(data.team_id == 1) {
			   cannon.blue_attack += 1;
			   if(cannon.red_attack > 0) {
				   cannon.red_attack -= 1;
			   }
			   if(cannon.blue_attack == 5) {
				   if(cannon.team_status == 0)
				    {
						cannon.team_status = 1;
					}else {
						
						cannon.team_status = 0;
						cannon.blue_attack = 0;
					}
			   }			   
		   }else {
			   cannon.red_attack += 1;
			   if(cannon.blue_attack > 0) {
				   cannon.blue_attack -=1;
			   }
			   if(cannon.red_attack == 5) {
				   
				   if(cannon.team_status ==0)
				   {
					   cannon.team_status = 2;
				   }else {
					   cannon.team_status = 0;
					   cannon.red_attack = 0;

				   }
			   };
		   }
			Send_CannonStatusChange(cannon.index,cannon.team_status, function() {
			
			});
		   //save change to database   
		   cannon.save(function(err, rdata) {
				   if(handler) {
					   return handler(rdata);
				   }
			   });
		   
	   });
   }
   
   /**
	* function to enable or disable the cannon and send this event to all client
	* flg is Cannon disable flg. True if you want to off, disable this cannon and false for other case
    */
	function OnOff_Cannon(data, flg, handler)
   {
	    var Cannon = mongoose.model('Cannon');
		Cannon.findOne({index : data.index}, function(err, cannon) {
			if(err || cannon == null) {
				console.error("OnOff Cannon: Find cannon error");
				if(handler) return handler();
				return;
			}
			cannon.disable = flg;
			cannon.save(function(err, redata) {
				if (err) {
					console.error("Save cannon status error");
					if(handler) return handler();
					return ;
				}
				ServerBroadcastData(io,"cannon_onoff",cannon);
				if(handler) return handler();
			});
			
			
			
		});
	   
   }
   
   /**
	* send neutral cannon change team event
    */
	function Send_CannonStatusChange(index, teamId, handler)
	{
		var data = {};
		data.index = index;
		data.team_id = teamId;
		setTimeout(function() {
			ServerBroadcastData(io,"cannon_change", data);
			
		},500);
		
		if(handler) {
			return handler();
		}
	}
	 
	 /****************************************************************************
	  * TITLE MAP FUNCTIONS
	  ***************************************************************************/
	  
	  