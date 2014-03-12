<?php
	
require_once( dirname(__FILE__) . "/../lib/PerformanceAuditManager.php");

$apiResults = array(
	"data" => null,
	"status"=>array(
		"code" => 0,
		"message" => "Success"
	)
);

$pa = new PerformanceAuditManager(
	array("BoomerangPerformanceAuditor")
);

$results = $pa->getAudits(
	array(
		"from" => $_REQUEST["from"],
		"to" => $_REQUEST["to"]
	)
);

foreach($results["audits"] as $auditor=>$report)
{
	foreach($report["reports"] as $audit)
	{
		$apiResults["data"]["realms"][$audit->getValue("realm")][$auditor][] = $audit->generateStats(true);
	}
}

echo json_encode($apiResults);