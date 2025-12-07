// controllers/privacyPolicyController.js

/**
 * @desc    Get Privacy Policy HTML content
 * @route   GET /api/privacy-policy
 * @access  Public
 */
const getPrivacyPolicy = async (req, res) => {
  try {
    const privacyPolicyHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Privacy Policy - HireHub</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              }
              
              body {
                  background-color: #f8f9fa;
                  color: #333;
                  line-height: 1.6;
                  padding: 20px;
                  max-width: 100%;
                  overflow-x: hidden;
              }
              
              .privacy-container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 12px;
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                  padding: 30px;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding-bottom: 20px;
                  border-bottom: 2px solid #f0f0f0;
              }
              
              .header h1 {
                  color: #8B5CF6;
                  font-size: 28px;
                  margin-bottom: 10px;
                  font-weight: 700;
              }
              
              .last-updated {
                  color: #666;
                  font-size: 14px;
                  margin-top: 5px;
              }
              
              .content-section {
                  margin-bottom: 25px;
              }
              
              .content-section h2 {
                  color: #4a5568;
                  font-size: 20px;
                  margin-bottom: 10px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: 10px;
              }
              
              .content-section p {
                  margin-bottom: 15px;
                  color: #4a5568;
                  font-size: 15px;
              }
              
              .content-section ul, .content-section ol {
                  margin-left: 20px;
                  margin-bottom: 15px;
              }
              
              .content-section li {
                  margin-bottom: 8px;
                  color: #4a5568;
                  font-size: 15px;
              }
              
              .highlight {
                  background-color: #f8f5ff;
                  border-left: 4px solid #8B5CF6;
                  padding: 15px;
                  margin: 15px 0;
                  border-radius: 0 8px 8px 0;
              }
              
              .contact-info {
                  background-color: #f0f9ff;
                  border: 1px solid #e0f2fe;
                  border-radius: 10px;
                  padding: 20px;
                  margin-top: 25px;
              }
              
              .contact-info h3 {
                  color: #0369a1;
                  margin-bottom: 10px;
              }
              
              .back-button {
                  display: inline-block;
                  margin-top: 25px;
                  padding: 12px 24px;
                  background-color: #8B5CF6;
                  color: white;
                  text-decoration: none;
                  border-radius: 8px;
                  font-weight: 600;
                  text-align: center;
                  border: none;
                  cursor: pointer;
                  font-size: 16px;
                  transition: background-color 0.3s;
              }
              
              .back-button:hover {
                  background-color: #7c3aed;
              }
              
              @media (max-width: 600px) {
                  .privacy-container {
                      padding: 20px 15px;
                      border-radius: 0;
                  }
                  
                  .header h1 {
                      font-size: 24px;
                  }
                  
                  .content-section h2 {
                      font-size: 18px;
                  }
              }
              
              .icon {
                  font-size: 20px;
              }
          </style>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      </head>
      <body>
          <div class="privacy-container">
              <div class="header">
                  <h1><i class="fas fa-shield-alt icon"></i> Privacy Policy</h1>
                  <p class="last-updated">Last Updated: ${new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                  })}</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-info-circle"></i> 1. Introduction</h2>
                  <p>Welcome to HireHub ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.</p>
                  <p>By using HireHub, you consent to the data practices described in this policy. If you do not agree with our policies and practices, please do not use our services.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-database"></i> 2. Information We Collect</h2>
                  <p>We collect several types of information for various purposes to provide and improve our service to you:</p>
                  
                  <h3>Personal Information:</h3>
                  <ul>
                      <li><strong>Account Information:</strong> Name, email address, phone number, profile picture</li>
                      <li><strong>User Type:</strong> Vendor or Customer designation</li>
                      <li><strong>Authentication Data:</strong> Firebase UID and login credentials</li>
                      <li><strong>Contact Details:</strong> Email address and mobile number for communication</li>
                  </ul>
                  
                  <h3>Property and Booking Information:</h3>
                  <ul>
                      <li>Property listings, images, descriptions, and pricing</li>
                      <li>Booking dates, times, and transaction details</li>
                      <li>Payment information (processed securely through third-party providers)</li>
                      <li>User reviews and ratings</li>
                  </ul>
                  
                  <h3>Technical Information:</h3>
                  <ul>
                      <li>Device information (model, operating system, unique device identifiers)</li>
                      <li>IP address and approximate location</li>
                      <li>App usage statistics and crash reports</li>
                      <li>Notification tokens for push notifications</li>
                  </ul>
              </div>
              
              <div class="highlight">
                  <p><strong>Important:</strong> We do not store your credit card information. All payment processing is handled by secure third-party payment processors.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-cogs"></i> 3. How We Use Your Information</h2>
                  <p>We use the collected information for the following purposes:</p>
                  <ul>
                      <li><strong>Service Delivery:</strong> To create and manage your account, process bookings, and facilitate property rentals</li>
                      <li><strong>Communication:</strong> To send booking confirmations, updates, and customer support responses</li>
                      <li><strong>Improvement:</strong> To analyze usage patterns and enhance user experience</li>
                      <li><strong>Safety and Security:</strong> To verify accounts, prevent fraud, and ensure platform integrity</li>
                      <li><strong>Marketing:</strong> To send promotional offers (with your consent) and important updates</li>
                      <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  </ul>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-share-alt"></i> 4. Information Sharing and Disclosure</h2>
                  <p>We may share your information in the following situations:</p>
                  
                  <h3>With Vendors/Customers:</h3>
                  <ul>
                      <li>Vendors receive customer information (name, contact) for completed bookings</li>
                      <li>Customers can view vendor profiles and property information</li>
                  </ul>
                  
                  <h3>With Service Providers:</h3>
                  <ul>
                      <li><strong>Cloud Services:</strong> Firebase (authentication), Cloudinary (image storage)</li>
                      <li><strong>Payment Processors:</strong> Secure payment gateways for transactions</li>
                      <li><strong>Analytics:</strong> Google Analytics for usage insights (anonymized data)</li>
                      <li><strong>Notifications:</strong> Push notification services</li>
                  </ul>
                  
                  <h3>Legal Requirements:</h3>
                  <ul>
                      <li>To comply with legal obligations or court orders</li>
                      <li>To protect our rights, property, or safety</li>
                      <li>To investigate potential violations of our Terms of Service</li>
                  </ul>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-lock"></i> 5. Data Security</h2>
                  <p>We implement appropriate technical and organizational security measures to protect your personal information, including:</p>
                  <ul>
                      <li>SSL/TLS encryption for data transmission</li>
                      <li>Secure server infrastructure with firewalls</li>
                      <li>Regular security assessments and updates</li>
                      <li>Access controls and authentication mechanisms</li>
                      <li>Regular data backups and disaster recovery procedures</li>
                  </ul>
                  <p>While we strive to protect your information, no electronic transmission or storage method is 100% secure.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-calendar-alt"></i> 6. Data Retention</h2>
                  <p>We retain your personal information only for as long as necessary:</p>
                  <ul>
                      <li><strong>Active Accounts:</strong> Until you delete your account</li>
                      <li><strong>Inactive Accounts:</strong> 24 months of inactivity</li>
                      <li><strong>Booking Records:</strong> 7 years for tax and legal compliance</li>
                      <li><strong>Support Inquiries:</strong> 3 years after resolution</li>
                  </ul>
                  <p>You may request deletion of your data by contacting us or using the account deletion feature in the app.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-globe"></i> 7. International Data Transfers</h2>
                  <p>Your information may be transferred to — and maintained on — computers located outside of your country where data protection laws may differ. We ensure appropriate safeguards are in place for such transfers.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-user-cog"></i> 8. Your Rights and Choices</h2>
                  <p>Depending on your location, you may have the following rights:</p>
                  <ul>
                      <li><strong>Access:</strong> Request a copy of your personal data</li>
                      <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                      <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                      <li><strong>Objection:</strong> Object to certain processing activities</li>
                      <li><strong>Portability:</strong> Receive your data in a structured format</li>
                      <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
                  </ul>
                  <p>To exercise these rights, contact us using the information below.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-cookie-bite"></i> 9. Cookies and Tracking</h2>
                  <p>Our app may use cookies and similar tracking technologies to:</p>
                  <ul>
                      <li>Remember your preferences and settings</li>
                      <li>Understand how you use our services</li>
                      <li>Improve performance and user experience</li>
                  </ul>
                  <p>You can control cookies through your browser settings.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-child"></i> 10. Children's Privacy</h2>
                  <p>Our services are not intended for users under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</p>
              </div>
              
              <div class="content-section">
                  <h2><i class="fas fa-edit"></i> 11. Changes to This Policy</h2>
                  <p>We may update this Privacy Policy periodically. We will notify you of significant changes by:</p>
                  <ul>
                      <li>Posting the new Privacy Policy in the app</li>
                      <li>Sending you an email notification</li>
                      <li>Updating the "Last Updated" date</li>
                  </ul>
                  <p>Continued use of our services after changes constitutes acceptance of the updated policy.</p>
              </div>
              
              <div class="contact-info">
                  <h3><i class="fas fa-envelope"></i> Contact Us</h3>
                  <p>If you have questions about this Privacy Policy or our data practices, contact us at:</p>
                  <ul>
                      <li><strong>Email:</strong> privacy@hirehub.com</li>
                      <li><strong>Address:</strong> 123 Privacy Street, Data City, DC 10001</li>
                      <li><strong>In-App:</strong> Settings → Help & Support</li>
                  </ul>
                  <p>We typically respond within 2-3 business days.</p>
              </div>
              
              <button class="back-button" onclick="window.ReactNativeWebView.postMessage('close')">
                  <i class="fas fa-arrow-left"></i> Back to App
              </button>
          </div>
          
          <script>
              // Handle back button for WebView
              function handleBackButton() {
                  if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage('close');
                  } else {
                      window.close();
                  }
              }
              
              // Add smooth scrolling for anchor links
              document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                  anchor.addEventListener('click', function(e) {
                      e.preventDefault();
                      const targetId = this.getAttribute('href');
                      if (targetId === '#') return;
                      
                      const targetElement = document.querySelector(targetId);
                      if (targetElement) {
                          targetElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                          });
                      }
                  });
              });
          </script>
      </body>
      </html>
    `;

    // Set content type to HTML
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(privacyPolicyHTML);
  } catch (error) {
    console.error('Privacy policy generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating privacy policy',
    });
  }
};

module.exports = {
  getPrivacyPolicy,
};