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

if( isset($_POST['key']) && isset($_POST['userId']) && isset($_POST['projectId']) && ( isset($_POST['blocks']) || 
isset($_POST['description']) || isset($_POST['name']) || isset($_POST['packageName']) || isset($_POST['versionName']) || 
isset($_POST['versionNumber']) || isset($_POST['homeWebsite']) || isset($_POST['minSdk']) || isset($_POST['icon']) || 
isset($_POST['incrementOnPublish']) || isset($_POST['proguard']) || isset($_POST['androidManifest']))) {
  header('Content-type: text/csv');

  if($_POST['key']==$SQLKEY){
    $conn = new mysqli($DB_ADDRESS,$DB_USER,$DB_PASS,$DB_NAME);    //connect

    if($conn->connect_error){                                                           //checks connection
      header("HTTP/1.0 400 Bad Request");
      echo "ERROR Database Connection Failed: " . $conn->connect_error, E_USER_ERROR;   //reports a DB connection failure
    } else {
      $exists = false;
      if (isset($_POST['name'])) {
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
        }
      }
      if (!$exists) {
      $query = 'UPDATE `projects` SET ' ;
      if (isset($_POST['blocks'])) {
        $query = $query . '`blocks`="' . urldecode($_POST['blocks']) . '"';
      }
      if (isset($_POST['description'])) {
        if (isset($_POST['blocks'])) {
          $query = $query . ', ';
        }
        $query = $query . '`description`="' . $_POST['description'] . '"';
      }
      if (isset($_POST['name'])) {
        if (isset($_POST['description']) || isset($_POST['blocks'])) {
          $query = $query . ', ';
        }
        $query = $query . '`name`="' . $_POST['name'] . '"';
      }
      if (isset($_POST['packageName'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks'])) {
          $query = $query . ', ';
        }
        $query = $query . '`packageName`="' . $_POST['packageName'] . '"';
      }
      if (isset($_POST['versionName'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName'])) {
          $query = $query . ', ';
        }
        $query = $query . '`versionName`="' . $_POST['versionName'] . '"';
      }
      if (isset($_POST['versionNumber'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName'])) {
          $query = $query . ', ';
        }
        $query = $query . '`versionNumber`="' . $_POST['versionNumber'] . '"';
      }
      if (isset($_POST['homeWebsite'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber'])) {
          $query = $query . ', ';
        }
        $query = $query . '`homeWebsite`="' . $_POST['homeWebsite'] . '"';
      }
      if (isset($_POST['minSdk'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber']) || isset($_POST['homeWebsite'])) {
          $query = $query . ', ';
        }
        $query = $query . '`minSdk`="' . $_POST['minSdk'] . '"';
      }
      if (isset($_POST['icon'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber']) || isset($_POST['homeWebsite']) || isset($_POST['minSdk'])) {
          $query = $query . ', ';
        }
        $query = $query . '`icon`="' . $_POST['icon'] . '"';
      }
      if (isset($_POST['incrementOnPublish'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber']) || isset($_POST['homeWebsite']) || isset($_POST['minSdk']) || isset($_POST['icon'])) {
          $query = $query . ', ';
        }
        $query = $query . '`incrementOnPublish`="' . $_POST['incrementOnPublish'] . '"';
      }
      if (isset($_POST['proguard'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber']) || isset($_POST['homeWebsite']) || isset($_POST['minSdk']) || isset($_POST['icon']) || isset($_POST['incrementOnPublish'])) {
          $query = $query . ', ';
        }
        $query = $query . '`proguard`="' . $_POST['proguard'] . '"';
      }
      if (isset($_POST['androidManifest'])) {
        if (isset($_POST['name']) || isset($_POST['description']) || isset($_POST['blocks']) || isset($_POST['packageName']) || isset($_POST['versionName']) || isset($_POST['versionNumber']) || isset($_POST['homeWebsite']) || isset($_POST['minSdk']) || isset($_POST['icon']) || isset($_POST['incrementOnPublish']) || isset($_POST['proguard'])) {
          $query = $query . ', ';
        }
        $query = $query . '`androidManifest`="' . $_POST['androidManifest'] . '"';
      }
      $query = $query . ' WHERE id=' . $_POST['projectId'];
      $result=$conn->query($query);                                                     //runs the posted query
      if($result === false){
        header("HTTP/1.0 400 Bad Request");                                             //sends back a bad request error
        echo "Wrong SQL: " . $query . " Error: " . $conn->error, E_USER_ERROR;          //errors if the query is bad and spits the error back to the client
      } else {
        header("HTTP/1.0 200 OK");
        echo "Success!";
      }
      $conn->close();                                          //closes the DB
    } else {
      header("HTTP/1.0 409 Conflict");
        echo "A project with the same name already exists.";
    }
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
