<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// Parse request data (handles both JSON and standard FormData / form-urlencoded)
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

// Honeypot check for spam bots
if (!empty($data['_gotcha']) || !empty($data['honeypot'])) {
    // Silently succeed to fool spam bots
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

// Extract and sanitize fields
$name    = isset($data['name'])    ? trim(strip_tags((string)$data['name']))    : '';
$email   = isset($data['email'])   ? trim(filter_var((string)$data['email'], FILTER_SANITIZE_EMAIL)) : '';
$company = isset($data['company']) ? trim(strip_tags((string)$data['company'])) : '-';
$product = isset($data['product']) ? trim(strip_tags((string)$data['product'])) : 'General Enquiry';
$need    = isset($data['need'])    ? trim(strip_tags((string)$data['need']))    : '';

// Map product codes to readable names if needed
$productMap = [
    '3d'   => '3D & CGI visuals',
    'film' => 'Product film',
    'ar'   => 'AR / 3D commerce',
    'web'  => 'Web experience',
    'all'  => 'The full pipeline'
];
if (isset($productMap[strtolower($product)])) {
    $product = $productMap[strtolower($product)];
}

// Validation
if (empty($name) || empty($need)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide your name and a brief description.']);
    exit;
}

// Destination email
$to = 'business@supermajor.in';
$cc = 'sasi@supermajor.in';

// Email Subject
$subject = "New Project Enquiry: " . $name . ($company !== '-' ? " (" . $company . ")" : "");

// Plain text body
$body = "You have received a new project enquiry from the Super Major website contact form.\n\n";
$body .= "--------------------------------------------------\n";
$body .= "Name:     " . $name . "\n";
if (!empty($email)) {
    $body .= "Email:    " . $email . "\n";
}
$body .= "Company:  " . $company . "\n";
$body .= "Service:  " . $product . "\n";
$body .= "--------------------------------------------------\n\n";
$body .= "Project Details / Brief:\n";
$body .= $need . "\n\n";
$body .= "--------------------------------------------------\n";
$body .= "Submitted: " . date('Y-m-d H:i:s T') . "\n";
$body .= "IP:        " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "\n";

// Headers (Formatted for GoDaddy cPanel & external mail relays)
$headers = [];
$headers[] = 'From: Super Major Website <business@supermajor.in>';
$headers[] = 'Sender: business@supermajor.in';
$headers[] = 'Return-Path: <business@supermajor.in>';
if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $email;
}
$headers[] = 'Cc: ' . $cc;
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$headerStr = implode("\r\n", $headers);

// Send email with GoDaddy envelope sender flag (-f)
$mailSent = @mail($to, $subject, $body, $headerStr, "-f" . $to);
if (!$mailSent) {
    // Fallback without 5th parameter in case hosting environment disallows it
    $mailSent = @mail($to, $subject, $body, $headerStr);
}

if ($mailSent) {
    @touch($cooldownFile);
    echo json_encode([
        'success' => true,
        'message' => 'Thank you! Your message has been sent.'
    ]);
} else {
    // If mail function fails on the server, return failure so the client JS can use FormSubmit fallback
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server mail transfer failed. Attempting fallback...'
    ]);
}
