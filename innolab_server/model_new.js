
// mongoose逕ｨ蛻晄悄蜃ｦ逅・
global.mongoose = require('mongoose');
global.Schema = mongoose.Schema;
mongoose.connect('mongodb://localhost/rts', // memo縺ｮ驛ｨ蛻・・繝・・繧ｿ繝吶・繧ｹ蜷・
  // 繧ｳ繝ｼ繝ｫ繝舌ャ繧ｯ縺ｧ繧ｨ繝ｩ繝ｼ譎ゅ・蜃ｦ逅・
  function(err) {
    if (err) {
      console.log('database connection error!');
      console.log(err);
    } else {
      console.log('database connection success!');
    }
  }
);

// 莉･荳九√せ繧ｭ繝ｼ繝槫ｮ夂ｾｩ鄒､

// rooms
global.RoomSchema = new Schema({
	room_id: Number,
	start_time:Number
});
mongoose.model('Room', RoomSchema);

// room_users
global.RoomUserSchema = new Schema({
	room_user_id: String,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	ready: Number,
	state: Number,
	npc: Number
});
mongoose.model('Room_user', RoomUserSchema);

// user_skills
global.UserSkillSchema = new Schema({
	user_skill_id: Number,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	mst_skill_id: Number, 
	cooldown_end_time: Number
});
mongoose.model('User_skill', UserSkillSchema);

// user_units
global.UserUnitSchema = new Schema({
	user_unit_id: Number,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	mst_unit_id: Number,
	position_x: Number,
	position_y: Number,
	direction : Number,
	hp: Number,
	mp: Number,
	status: Number,
	angle : Number,
	uuid : String,
	moving : Boolean,
	/*
	*******************
	* Unit stat for attack logic
	*******************
	*/
	attack : Number,
	defence : Number,
	element : Number
});
mongoose.model('User_unit', UserUnitSchema);

// user_unit_skills
global.UserUnitSkillSchema = new Schema({
	user_unit_skill_id: Number,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	user_unit_id: Number,
	mst_skill_id: Number,
	cooldown_end_time: Number
});
mongoose.model('User_unit_skill', UserUnitSkillSchema);

// user_unit_status_aliment
global.UserUnitStatusAlimentSchema = new Schema({
	user_unit_status_aliment_id: Number,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	user_unit_id: Number,
	mst_status_aliment_id: Number,
	effect_end_time: Number
});
mongoose.model('User_unit_status_aliment', UserUnitStatusAlimentSchema);

// user_unit_buffer
global.UserUnitBufferSchema = new Schema({
	user_unit_buffer_id: Number,
	room_id: Number,
	team_id: Number,
	user_id: Number,
	user_unit_id: Number,
	effect_end_time: Number,
	buff_effect_type: Number,
	correct_type: Number,
	corrett_value: Number
}); 
mongoose.model('User_unit_buffer', UserUnitBufferSchema);

// builds
global.BuildSchema = new Schema({
	build_id: Number,
	team_id : Number,
	field_id: Number,
	position_x: Number,
	position_y: Number,
	status: Number
});
mongoose.model('Build', BuildSchema);

/**
 * Schema for battle kill/dead, dame ...
 */
global.BattleInfoSchema = new Schema({
	room_id: Number,
	team_id: Number,
	user_id: Number,
	unit_id: Number,
	uuid : String,
	killNum: Number,
	deadNum: Number,
	assistNum: Number,
	longestKillStreak: Number,
	maxKillCombo: Number,
	totalDealDame : Number,
	totalReceiveDame : Number
});
mongoose.model('BattleInfo', BattleInfoSchema);

/**
 * Schema for save Battle background color
 */
global.MapSchema = new Schema({
	x : Number,
	y : Number,
	color : Number,
	disable : Boolean
});
mongoose.model('Map', MapSchema);

/**
 * Schema for save Neutral tower status
 */
global.NeutralTowerSchema = new Schema({
	index : Number,
	team_status : Number,
	red_attack : Number,
	blue_attack : Number,
	pos_x : Number,
	pos_y : Number
});
mongoose.model('Neutral_tower', NeutralTowerSchema);
 
/**
 * Schema for save neutral unit data
 */ 
global.NeutralUnitSchema = new Schema({
	index : Number,
	team_status : Number,
	red_attack : Number,
	blue_attack : Number,
	pos_x : Number,
	pos_y : Number,
	direction :Number
});
mongoose.model('Neutral_unit', NeutralUnitSchema); 
 
global.CannonSchema = new Schema( {
	index : Number,
	team_status : Number,
	red_attack : Number,
	blue_attack : Number,
	disable : Boolean
});
mongoose.model('Cannon', CannonSchema);

 
/**
 * Schema for save wormhold infor and status
 */
global.WormHoleSchema = new Schema( {
	index : Number, /* index mean the hole index in list of client data*/
	status : Number /* status mean useable (1) or un-useable (0) */
});
mongoose.model("Worm_hole", WormHoleSchema);

