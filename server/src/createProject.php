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

if( isset($_POST['key']) && isset($_POST['name']) && isset($_POST['description']) 
&& isset($_POST['packageName']) && isset($_POST['userId']) ){                                   //checks if the tag post is there and if its been a proper form post
  //set content type to CSV (to be set here to be able to access this page also with a browser)
  header('Content-type: text/csv');

  if($_POST['key']==$SQLKEY){
    $conn = new mysqli($DB_ADDRESS,$DB_USER,$DB_PASS,$DB_NAME);    //connect

    if($conn->connect_error){                                                           //checks connection
      header("HTTP/1.0 400 Bad Request");
      echo "ERROR Database Connection Failed: " . $conn->connect_error, E_USER_ERROR;   //reports a DB connection failure
    } else {
      $result=$conn->query('SELECT `userId` FROM `projects` WHERE name="' . $_POST['name'] . '"');
      if ($result === false) {
        header("HTTP/1.0 400 Bad Request");                                             //sends back a bad request error
        echo "Wrong SQL: " . $query . " Error: " . $conn->error, E_USER_ERROR;
      } else {
        // only allow one project name per account.
        $rows = [];
        for ($x = 1; $x <= $conn->affected_rows; $x++) {
          $rows[] = $result->fetch_assoc();
        }
        $exists = false;
        foreach ($rows as $item) {
          if ($item['userId'] == $_POST['userId']) {
            $exists = true;
            break;
          }
        }
        if (!$exists) {
        $result=$conn->query("INSERT INTO `projects`(`name`, `description`, `packageName`, `userId`, `blocks`) VALUES ('" . $_POST['name'] . "', '" . $_POST['description'] . "', '" . $_POST['packageName'] . "', '" . $_POST['userId'] . "', '')");                                                     //runs the posted query
        if($result === false){
          header("HTTP/1.0 400 Bad Request");                                             //sends back a bad request error
          echo "Wrong SQL: " . $query . " Error: " . $conn->error, E_USER_ERROR;          //errors if the query is bad and spits the error back to the client
        } else {
          header("HTTP/1.0 200 OK");
          $result=$conn->query('SELECT * FROM `projects` WHERE name="' . $_POST['name'] . '" AND description="' . $_POST['description'] . '" AND packageName="' . $_POST['packageName'] . '"AND userId= ' . $_POST['userId']);
          if ($result === false) {
          header("HTTP/1.0 400 Bad Request");                                             //sends back a bad request error
          echo "Wrong SQL: " . $query . " Error: " . $conn->error, E_USER_ERROR;
        } else {
          $rows = [];
          for ($x = 1; $x <= $conn->affected_rows; $x++) {
            $rows[] = $result->fetch_assoc();
          }
          header("HTTP/1.0 200 OK");
          echo json_encode(array($rows[0]));
          //echo json_encode(array('projectId' => , $rows[0]['id']));
        }
        }
      } else {
        header("HTTP/1.0 409 Conflict");
        echo "A project with the same name already exists.";
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
