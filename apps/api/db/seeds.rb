# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create admin user from credentials
# Add the following to your credentials file:
#   admin:
#     email: "your@email.com"
#     password: "your-secure-password"

admin_email = Rails.application.credentials.dig(:admin, :email)
admin_password = Rails.application.credentials.dig(:admin, :password)

if admin_email.present? && admin_password.present?
  user = User.find_or_initialize_by(email: admin_email)
  user.password = admin_password
  user.save!
  puts "Admin user ready: #{admin_email}"
else
  puts "Skipping admin user creation: admin credentials not configured"
end
