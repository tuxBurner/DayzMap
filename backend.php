<?php
/**
* Simple php script which handles adding markers to the map and removing them
* Storing the stuff in a sqllite db
*/

/**
* CREATE TABLE markers (id integer PRIMARY KEY,name text NOT NULL,typ VARCHAR NOT NULL, description text , langX long NOT NULL, langY long NOT NULL);
*/
function connectDB() {
  try {
    $db = new PDO("sqlite:db/dayz.db");
    return $db;
  } catch(PDOException $e) {
    die($e->getMessage());
  }
}

function queryDB($db,$sql) {

  $qh = $db->prepare($sql);

  if(!$qh) {
    die("query error ($sql)");
  }

  $qh->setFetchMode(PDO::FETCH_ASSOC);
  $qh->execute();

  return $qh;
}

$db = connectDB();

// add a marker
if(!empty($_POST['langX']) && !empty($_POST['langY']) && !empty($_POST['name']) && !empty($_POST['typ'])) {
  $dbh = $db->prepare("INSERT INTO markers (name,typ,langx,langy,description) VALUES (:name, :typ,  :langX, :langY, :description)");
  $dbh->bindParam(':name', $_POST['name']);
  $dbh->bindParam(':typ', $_POST['typ']);
  $dbh->bindParam(':description', $_POST['description']);
  $dbh->bindParam(':langX', $_POST['langX']);
  $dbh->bindParam(':langY', $_POST['langY']);
  $dbh->execute();
}

// edit marker
if(!empty($_POST['id']) && !empty($_POST['name']) && !empty($_POST['typ'])) {
	$dbh = $db->prepare("UPDATE markers SET name=:name, typ=:typ, description=:description WHERE id=:id");
	$dbh->bindParam(':id', $_POST['id']);
	$dbh->bindParam(':name', $_POST['name']);
    $dbh->bindParam(':typ', $_POST['typ']);
    $dbh->bindParam(':description', $_POST['description']);
    $dbh->execute();
}

// delete a marker
if($_GET['action'] == 'delMarker' && !empty($_GET['id'])) {
  $dbh = $db->prepare("DELETE FROM markers where id = :id");
  $dbh->bindParam(':id', $_GET['id'],PDO::PARAM_INT);
  $dbh->execute();
}

// repos marker
if($_GET['action'] == 'reposMarker' && !empty($_GET['id']) && !empty($_GET['langX']) && !empty($_GET['langY'])) {
  $dbh = $db->prepare("UPDATE markers SET langx=".$_GET['langX'].", langy=".$_GET['langY']."  WHERE id=".$_GET['id']."");
  $dbh->execute();
}


$markers = queryDB($db,"SELECT * FROM markers ORDER BY typ ASC,name DESC");
$typCats = queryDB($db,"SELECT DISTINCT(typ) FROM markers ORDER BY typ ASC");
$returnVal =  array("types" => $typCats->fetchAll(), "markers" => $markers->fetchAll());
echo json_encode($returnVal);
?>