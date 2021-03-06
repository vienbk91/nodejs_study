
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
	hp: Number,
	mp: Number,
	status: Number
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
	field_id: Number,
	position_x: Number,
	position_y: Number,
	hp: Number,
	status: Number
});
mongoose.model('Build', BuildSchema);

