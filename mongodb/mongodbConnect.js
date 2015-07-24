/**
 * Cac thao tac voi mongoDB
 */
 
 
var MongoClient = require('mongodb').MongoClient;

// 'mongodb://localhost:27017/database_name'
var url = 'mongodb://localhost:27017/test';

var myCollection;
var db;

/**
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * + Tat ca cac function deu truyen vao 1 ham callback    +
 * ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 * 
 */

// Create connection
function createConnection(onCreate){
	MongoClient.connect(url , function(error , db){
		if(error){
			console.log('Error : ' , + error);
		}else{
			console.log('Connected on the mongoDB!');
			// Create collection(table) 'users'
			myCollection = db.collection('users');			
			// Callback
			onCreate();
		}
	});
}


function insertDocument(onInsert){	
	// create document with 3 field(column): name , age and roles
	var user1 = {name : 'vien' , age : 23 , roles : ['admin' , 'moderator' , 'user']};
	var user2 = {name : 'suzuki' , age : 22 , roles : ['user']};
	var user3 = {name : 'Kim1' , age : 27 , roles : ['user']};
	var user4 = {name : 'Kim2' , age : 27 , roles : ['user']};
	var user5 = {name : 'Kim3' , age : 27 , roles : ['user']};
	var user6 = {name : 'Kim4' , age : 27 , roles : ['user']};
	
	// Insert 6 document(rows)
	myCollection.insert([user1 , user2 , user3 , user4 , user5 , user6] , function(error , result){
		if(error){
			console.log('Error' , error);
		}else{
			console.log('Insert succesfull');
		}
		
		// Callback
		onInsert();
	});
}

/**
 * // update(doi_tuong_update , gia_tri_update , callback)
 */
 
// update simple
function simpleUpdateDocument(onUpdateSimple){
	// Update truong age
	myCollection.update({name : 'Kim3'} , {name : 'Kim3' , age : 21 , roles : ['user']} , {w:1} , function(error , result){
		if(error){
			console.log('Error' , error);
		}else{
			console.log('Simple Update succesfull');
		}
		
		onUpdateSimple();
	});
}

// update field
function fieldUpdateDocument(onUpdateField){
	// Khi su dung $set thi chi nhung truong trong $set moi duoc update
	// Ta cung co the them 1 truong moi bang cach su dung $set
	// $set dung de gan gia tri cho 1 truong co dinh , neu ko co thi no se mac dinh khoi tao va insert vao
	// Con neu muon tang gia tri cho 1 truong nao do ta su dung $inc
	myCollection.update({name : 'suzuki'} , {$set : {age : 25 , roles:['user' , 'super-admin'] , industry : 'Franse'} } , {w:1} , function(error , result){
		if(error){
			console.log('Error' , error);
		}else{
			console.log('Field Update succesfull');
		}
		
		onUpdateField();
	});
}

function fieldComplexeUpdateDocument(onUpdateField){
	myCollection.update({name : 'Kim1'} , {$set:{ company : {employ : 10 , officeName : 'BOI' , industries : ['method' , 'function']} }} , {w:1} , function(error , result){
		if(error){
			console.log('Error' , error);
		}else{
			console.log('Field completex Update succesfull');
		}
		
		onUpdateField();
	});
}

function findDocument(onFinded){
    var cursor = myCollection.find({name : 'vien'});
    cursor.each(function(err, doc) {
        if(err)
            throw err;
        if(doc==null)
            return;
 
        console.log("document find:");
        console.log(doc.name);
        onFinded();
    });
}



// Delete document in collection
function removeDocument(onRemove){
	myCollection.findAndModify({name : 'Kim4'} , [] , {remove:true} , function(error , result){
		if(error){
			console.log('Error' , error);
		}else{
			console.log('Remove succesfull');
		}
		
		onRemove();
	});
}

// main
createConnection(function(){
	insertDocument(function(){
		simpleUpdateDocument(function(){
			fieldUpdateDocument(function(){
				fieldComplexeUpdateDocument(function(){
					findDocument(function(){
						removeDocument(function(){
							console.log('The end');
						});
					});
				});
			});
		});
	});
});