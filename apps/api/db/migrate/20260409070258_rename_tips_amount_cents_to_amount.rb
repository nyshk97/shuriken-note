class RenameTipsAmountCentsToAmount < ActiveRecord::Migration[8.1]
  def change
    rename_column :tips, :amount_cents, :amount
    change_column_default :tips, :currency, from: 'usd', to: 'jpy'
  end
end
