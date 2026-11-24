<?php
// Dedicated enquiry handler for 3d-product-animation.html (marketing campaign landing page).
// Kept separate from contact.php so campaign leads are clearly labelled and
// changes to the main contact form never affect the campaign.
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = [];
if (!empty($rawInput)) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
if (empty($data)) {
    $data = $_POST;
}

// Honeypot
if (!empty($data['_gotcha']) || !empty($data['honeypot'])) {
    echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been sent.']);
    exit;
}

// Per-IP cooldown so a script posting here in a loop can't flood the inbox.
// shortcut: one file per IP in the temp folder; switch to a captcha if spam comes from many IPs.
$cooldownFile = sys_get_temp_dir() . '/sm_contact_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (file_exists($cooldownFile) && time() - filemtime($cooldownFile) < 60) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Please wait a minute before sending another enquiry.']);
    exit;
}

// Strip tags and line breaks (prevents header injection in subject/headers)
function clean($v, $default = '-') {
    $v = trim(strip_tags((string)$v));
    $v = preg_replace('/[\r\n]+/', ' ', $v);
    return $v === '' ? $default : $v;
}
function field($data, $k, $default = '-') {
    return isset($data[$k]) ? clean($data[$k], $default) : $default;
}

$name    = field($data, 'name', '');
$email   = isset($data['email']) ? trim(filter_var((string)$data['email'], FILTER_SANITIZE_EMAIL)) : '';
$phone   = field($data, 'phone');
$company = field($data, 'company');
$product = field($data, 'product', '3D Product Animation');
$need    = isset($data['need']) ? trim(strip_tags((string)$data['need'])) : '';

// Campaign tracking (UTM parameters passed by the page)
$utm = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'page_url', 'referrer'] as $k) {
    $utm[$k] = field($data, $k);
}

if ($name === '' || $need === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide your name, a valid email and project details.']);
    exit;
}

$from = 'business@supermajor.in';
$to   = 'business@supermajor.in';
$cc   = 'sasi@supermajor.in';

$subject = '[3D Animation Campaign] New enquiry: ' . $name . ($company !== '-' ? ' (' . $company . ')' : '');

$body  = "New lead from the 3D Product Animation campaign page (3d-product-animation.html).\n\n";
$body .= "--------------------------------------------------\n";
$body .= "Name:     $name\n";
$body .= "Email:    $email\n";
$body .= "Phone:    $phone\n";
$body .= "Company:  $company\n";
$body .= "Service:  $product\n";
$body .= "--------------------------------------------------\n\n";
$body .= "Project Details / Brief:\n$need\n\n";
$body .= "--------------------------------------------------\n";
$body .= "Campaign tracking\n";
foreach ($utm as $k => $v) {
    $body .= str_pad($k . ':', 14) . $v . "\n";
}
$body .= "--------------------------------------------------\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'IP:        ' . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";

$headers = [
    'From: Super Major Website <business@supermajor.in>',
    'Sender: business@supermajor.in',
    'Return-Path: <business@supermajor.in>',
    'Reply-To: ' . $email,
    'Cc: ' . $cc,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];
$headerStr = implode("\r\n", $headers);

$mailSent = @mail($to, $subject, $body, $headerStr, '-f' . $from);
if (!$mailSent) {
    $mailSent = @mail($to, $subject, $body, $headerStr);
}

if ($mailSent) {
    @touch($cooldownFile);
    echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been sent.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server mail transfer failed. Attempting fallback...']);
}
