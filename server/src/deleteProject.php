<?php
//DATABSE DETAILS//
$DB_ADDRESS="localhost";
$DB_USER="id17207414_aixbuilderdb";
$DB_PASS="PtQ2b\oOX6IJaZ{z";
$DB_NAME="id17207414_aixbuilder_db";

//SETTINGS//
$SQLKEY='aixbuildr@@584390';

//these are just in case setting headers forcing it to always expire
header('Cache-Control: no-cache, must-revalidate');
header('Access-Control-Allow-Origin: *');

error_log(print_r($_POST,TRUE));

if( isset($_POST['key']) && isset($_POST['id']) ){                                   //checks if the tag post is there and if its been a proper form post
  //set content type to CSV (to be set here to be able to access this page also with a browser)
  header('Content-type: text/csv');

  if($_POST['key']==$SQLKEY){
    $conn = new mysqli($DB_ADDRESS,$DB_USER,$DB_PASS,$DB_NAME);    //connect

    if($conn->connect_error){                                                           //checks connection
      header("HTTP/1.0 400 Bad Request");
      echo "ERROR Database Connection Failed: " . $conn->connect_error, E_USER_ERROR;   //reports a DB connection failure
    } else {
      $result=$conn->query("DELETE FROM `project` WHERE id=" . $_POST['id']);                                                     //runs the posted query
      if($result === false){
        header("HTTP/1.0 400 Bad Request");                                             //sends back a bad request error
        echo "Wrong SQL: " . $query . " Error: " . $conn->error, E_USER_ERROR;          //errors if the query is bad and spits the error back to the client
      } else {
        if ($conn->affected_rows == 0) {
          header("HTTP/1.0 404 Not Found");
          echo json_encode(array("message" => "No project was found with the given ID."));
        } else {
          header("HTTP/1.0 200 OK");
          echo json_encode(array("message" => "Project Successfully Deleted."));
        }
      }
      $conn->close();                                          //closes the DB
    }
  } else {
     header("HTTP/1.0 400 Bad Request");
     echo "Bad Request.";                                       //reports if the secret key was bad
  }
} else {
        header("HTTP/1.0 400 Bad Request");
        echo "Bad Request.";
}
?>
