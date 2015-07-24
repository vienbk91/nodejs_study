/**
 * Thao tac du lieu voi mongoDB qua mongoose 
 */

 var Mongoose = require('mongoose');
 
 // Connect with local mongodb name 'test'
 var url = 'mongodb://localhost:27017/test';
 
 function createConnection(onCreate){
   // Check connect mongodb
   Mongoose.connect( url , function(error){
     if(error)
     {
       console.log('Error : ' , error);
     }else{
       console.log('Connected with mongoDB'); 
       
       onCreate();
     }
   });
 }
 
 
/**
 * Schema la cach ma mongoose quan ly mongodb
 * Moi schema tuong ung voi 1 doi tuong collection trong mongodb
 */
 
 // Dinh nghia schema cua mongoose
var Schema = Mongoose.Schema;
 
 // Khoi tao 1 doi tuong schema co ten la BookSchema
var BookSchema = new Schema({
  book_name : String ,
  book_id : Number ,
  tacgia : String ,
  nhaxuatban : String ,
  namxuatban : Number ,
  theloai : String ,
  trangthai : Boolean // true: con hang , false : het hang
});
 
 // Khoi tao 1 doi tuong collection theo Schema da xa dung
 // Tao 1 collection Books theo schema
 // Trong TH nay thi Books la 1 bien toan cuc, nen co the su dung o tat ca cac function ma ko can dinh nghia
 // O cac class khac neu khogn dinh nghia no lam bien global ma muon su dung schema Books nay thi ta phai goi lai no theo cach sau
 // var Books = Mongoose.model('Books');
 var Books = Mongoose.model('Books' , BookSchema);
 
 function insertDocument(onInsert){
     // Tao 3 document
     var book1 = new Books({
       book_name : 'Toi tai gioi , ban cung the' , book_id : 1 , tacgia : 'Tran Dang Khoa' , 
       nhaxuatban : 'NXB Kim Dong' , namxuatban : 1990 , theloai : 'Kinh te' , trangthai : true
     });
     
     var book2 = new Books({
       book_name : 'Day con lam giau' , book_id : 2 , tacgia : 'Uong Xuan Vy' , 
       nhaxuatban : 'NXB Kim Dong' , namxuatban : 2009 , theloai : 'Kinh te' , trangthai : true
     });
     
     var book3 = new Books({
       book_name : 'De thi dam mau' , book_id : 3 , tacgia : 'Quy Co Nu' , 
       nhaxuatban : 'NXB Thanh Nien' , namxuatban : 2010 , theloai : 'Truyen trinh tham' , trangthai : false
     });
     
     
      /**
      * Neu khong khai bao truoc cac document thi
      * ta co the create truc tiep gia tri cho document bang cach
      * Books.create({book_name : 'xxx' , book_id : 1 , ...});
      * 
      */
     
     Books.create({
       book_name : 'Anh trai em gai' , book_id : 4 , tacgia : 'Co Man' , 
       nhaxuatban : 'NXB Bach khoa' , namxuatban : 2006 , theloai : 'Ngon tinh' , trangthai : true
       });
       
    Books.create({
     book_name : 'Hon le thang 3' , book_id : 5 , tacgia : 'Co Man' , 
     nhaxuatban : 'NXB Phang phap' , namxuatban : 2012 , theloai : 'Ngon tinh' , trangthai : true
     });
     
     Books.create({
     book_name : 'Kamasutra' , book_id : 6 , tacgia : 'An Do Gia' , 
     nhaxuatban : 'NXB Phang phap' , namxuatban : 2007 , theloai : 'Phang phap' , trangthai : false
     });
     
     // insert document vao collection
     Books.create([book1 , book2 , book3] , function(error , data){
         if(error){
            console.log('Error : ' , error); 
         }else{
           console.log('Insert Data Succesfull');  
           onInsert();
         }
     }); 
 }
 
 // Update document in collection
 // upsert = true co nghia la neu ko tim thay ban tin can update thi no se insert document nay vao
 // Trong mongoose khong can khai bao $set nhu trong update mongo binh thuong
 // Vi mongoose mac dinh update voi $set nen se thay the cac document tuong ung
 function simpleUpdateDocument(onSimpleUpdate){
   Books.update({book_id : 3} , {namxuatban : 2014 } ,{upsert : true} ,function(error){
     if(error){
       console.log('Error : ' , error);
     }else{
       console.log('Simple Update Succesfull!');
       onSimpleUpdate();
     }
   });
 }
 
 
 function fieldComplexUpdateDocument(onUpdate){
   
   Books.findOne({book_id : 6} , function(error , book){
     book.trangthai = true;
     book.namxuatban = 2017;
     book.save(function(error){
       if(error){
         console.log('Error' , error);
       }else{
         console.log('Complex Update Succesfull Ver1');
         onUpdate();
       }
     });
   });
   
   // Book4 : trangthai : true , namsanxuat : 2006 , theloai : Ngon tinh
   Books.update({book_id : 4} ,{ trangthai : false ,  namxuatban : 2012 , theloai : 'Kiem hiep' } , {upsert: true} ,  function(error){
     if(error){
       console.log('Error' , error);
     }else{
       console.log('Complex Update Succesfull Ver2');
       onUpdate();
     }
   });
   
   // Truong hop tu dong them truong nhu trong mongodb se khong the su dung duoc vi neu muon them truong thi ta phai them
   // tai schema truoc
 }
 
 
 function removeDocument(onRemove){
   Books.remove({book_id : 5} , function(error){
     if(error){
       console.log('Error :' , error);
     }else{
       console.log('Remove Succesfull');
       onRemove();
     }
   });
 }
 
 
 createConnection(function(){
   insertDocument(function(){
     simpleUpdateDocument(function(){
       fieldComplexUpdateDocument(function(){
         removeDocument(function(){
           console.log('The end');
         });
       });      
     });
   });
 });