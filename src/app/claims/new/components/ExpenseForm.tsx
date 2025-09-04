'use client'

import { useState } from 'react'
import { ExpenseItem } from '../page'

interface ItemType {
  id: number
  name: string
  no: string
}

interface Currency {
  id: number
  name: string
  code: string
}

interface ExpenseFormProps {
  itemTypes: ItemType[]
  currencies: Currency[]
  exchangeRates: Record<string, number>
  onAddItem: (item: Omit<ExpenseItem, 'id'>) => void
}

export default function ExpenseForm({ itemTypes, currencies, exchangeRates, onAddItem }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    month: '12',
    day: '25',
    itemNo: 'C2',
    note: 'Business meeting lunch',
    details: 'Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)',
    currency: 'SGD',
    amount: '45.80',
    evidenceNo: '001'
  })

  const forexRate = exchangeRates[formData.currency] || 1.0000
  const sgdAmount = (parseFloat(formData.amount) || 0) * forexRate

  const handleAddItem = () => {
    
    if (!formData.month || !formData.day || !formData.itemNo || !formData.note || !formData.amount) {
      alert('请填写所有必填字段')
      return
    }

    const item = {
      date: `${formData.month.padStart(2, '0')}/${formData.day.padStart(2, '0')}`,
      itemNo: formData.itemNo,
      note: formData.note,
      details: formData.details,
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      rate: forexRate,
      sgdAmount: sgdAmount,
      evidenceNo: formData.evidenceNo
    }

    onAddItem(item)
    
    // 清空表单
    setFormData({
      month: '',
      day: '',
      itemNo: '',
      note: '',
      details: '',
      currency: 'SGD',
      amount: '',
      evidenceNo: ''
    })
  }


  return (
    <div className="bg-white border border-gray-300 p-4 mb-6">
      <h3 className="text-md font-semibold mb-4 pb-2 border-b border-gray-200">
        Expense Details
      </h3>

      <div>
        {/* 第一行：日期、项目类型、GL账户、备注 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Date</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="MM"
                maxLength={2}
                className="w-12 px-2 py-1 text-sm border border-gray-300 text-center"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: e.target.value})}
              />
              <span>/</span>
              <input
                type="text"
                placeholder="DD"
                maxLength={2}
                className="w-12 px-2 py-1 text-sm border border-gray-300 text-center"
                value={formData.day}
                onChange={(e) => setFormData({...formData, day: e.target.value})}
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Item No</label>
            <select
              className="w-full px-2 py-1 text-sm border border-gray-300"
              value={formData.itemNo}
              onChange={(e) => setFormData({...formData, itemNo: e.target.value})}
            >
              <option value="">Select</option>
              {itemTypes.map(type => (
                <option key={type.id} value={type.no}>
                  {type.no} - {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-none w-20">
            <label className="block text-xs font-semibold mb-1">GL Acct</label>
            <input
              type="text"
              disabled
              className="w-full px-2 py-1 text-sm border border-gray-300 bg-gray-50"
              value="420" // 简化版本，固定值
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Item / Note</label>
            <input
              type="text"
              placeholder="Brief description"
              className="w-full px-2 py-1 text-sm border border-gray-300"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>
        </div>

        {/* 详细说明 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1">
            Details/Reason (Please Indicate Restaurant name or Supplier Name)
          </label>
          <textarea
            placeholder="e.g., Meeting with KPMG - Taxi from office to Suntec tower one - (Comfort Delgro)"
            className="w-full px-2 py-1 text-sm border border-gray-300 resize-vertical min-h-[60px]"
            value={formData.details}
            onChange={(e) => setFormData({...formData, details: e.target.value})}
          />
        </div>

        {/* 金额行 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Currency</label>
            <select
              className="w-full px-2 py-1 text-sm border border-gray-300"
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
            >
              {currencies.map(currency => (
                <option key={currency.id} value={currency.code}>{currency.code}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-2 py-1 text-sm border border-gray-300"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">Forex Rate</label>
            <input
              type="text"
              disabled
              className="w-full px-2 py-1 text-sm border border-gray-300 bg-gray-50"
              value={forexRate.toFixed(4)}
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">SGD Amount</label>
            <input
              type="text"
              disabled
              className="w-full px-2 py-1 text-sm border border-gray-300 bg-gray-50"
              value={sgdAmount.toFixed(2)}
            />
          </div>

          <div className="flex-none w-20">
            <label className="block text-xs font-semibold mb-1">Evidence</label>
            <input
              type="text"
              placeholder="No."
              className="w-full px-2 py-1 text-sm border border-gray-300"
              value={formData.evidenceNo}
              onChange={(e) => setFormData({...formData, evidenceNo: e.target.value})}
            />
          </div>
        </div>

        {/* 添加按钮 */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleAddItem}
            className="px-4 py-2 bg-black text-white hover:bg-gray-800"
          >
            + Add Item
          </button>
        </div>
      </div>
    </div>
  )
}