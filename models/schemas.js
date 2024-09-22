const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
  {
    timeStamp: {
      type: Date,
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number
    },
  },
  {
    collection: 'product',
  }
);

const invoiceSchema = new mongoose.Schema(
  {
    timeStamp: {
      type: Date,
    },
    customer: {
      type: String,
    },
    tanggalTerima:{
      type: Date
    },
    tanggalSelesai:{
      type: Date
    },
    downPayment:{
      type: Number
    },
    products: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }],
    grandPrice: Number,
    createdAt: { type: Date, default: Date.now }
  });

  // invoiceSchema.pre('save', async function (next) {
  //   const invoice = this;
    
  //   // Loop through each product in the invoice
  //   let grandTotal = 0;
    
  //   for (let item of invoice.products) {
  //     const product = await mongoose.model('Product').findById(item.productId);
      
  //     if (product) {
  //       item.totalPrice = product.price * item.quantity; // calculate total price for each product
  //       grandTotal += item.totalPrice; // accumulate grand total
  //     }
  //   }
  
  //   // Set grand total
  //   invoice.grandPrice = grandTotal;
  
  //   next();
  // });

  const Product = mongoose.model('Product', productSchema);
  const Invoice = mongoose.model('Invoice', invoiceSchema);
  
  module.exports = { Product, Invoice };