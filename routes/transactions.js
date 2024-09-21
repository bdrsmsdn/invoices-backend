const express = require('express');
const pdf = require('html-pdf');
const { body, param, validationResult } = require('express-validator');
const { Product, Invoice } = require('../models/schemas');

const router = express.Router();

function getFormattedDate() {
  return new Date().toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(',', '');
}

// Product Routes
router.post('/products', 
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const { name, price } = req.body;
      await Product.create({ timeStamp: getFormattedDate(), name, price: price || 0 });
      res.status(201).json({ error: false, message: 'Product added successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  }
);

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ timeStamp: 1 });
    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: true, message: 'Internal Server Error' });
  }
});

router.delete('/products/:id', 
  param('id').isMongoId().withMessage('Invalid product ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) {
        return res.status(404).json({ error: true, message: 'Product not found' });
      }
      res.status(200).json({ error: false, message: 'Product deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  }
);

router.put('/products/:id', 
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const { name, price } = req.body;
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, price, timeStamp: getFormattedDate() },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ error: true, message: 'Product not found' });
      }

      res.status(200).json({ error: false, message: 'Product updated successfully', product });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  }
);

router.get('/products/:id', 
  param('id').isMongoId().withMessage('Invalid product ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: true, message: 'Product not found' });
      }
      res.status(200).json(product);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: true, message: 'Internal Server Error' });
    }
  }
);

// Invoice Routes
router.post('/invoices', 
  body('customer').notEmpty().withMessage('Customer name is required'),
  // body('tanggalTerima').isISO8601().withMessage('Invalid date format for tanggalTerima'),
  // body('tanggalSelesai').isISO8601().withMessage('Invalid date format for tanggalSelesai'),
  body('downPayment').isNumeric().withMessage('Down payment must be a number'),
  body('products').isArray().withMessage('Products must be an array'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const { customer, tanggalTerima, tanggalSelesai, downPayment, products } = req.body;
      const newInvoice = new Invoice({
        customer,
        tanggalTerima,
        tanggalSelesai,
        downPayment,
        products: products.map(product => ({
          productId: product.productId,
          quantity: product.quantity
        })),
        timeStamp: new Date()
      });

      await newInvoice.save();
      res.status(201).json({ error: false, message: 'Invoice created successfully', data: newInvoice });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: true, message: 'Error creating invoice', error });
    }
  }
);

// READ (Get All Invoices)
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('products.productId');

    const invoicesWithTotalPrice = invoices.map(invoice => {
      const productsWithTotalPrice = invoice.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.productId.price, // Ambil harga dari productId
        totalPrice: product.productId.price * product.quantity // Hitung totalPrice
      }));

      return {
        ...invoice.toObject(), // Konversi invoice ke objek biasa
        products: productsWithTotalPrice,
        grandPrice: productsWithTotalPrice.reduce((sum, p) => sum + p.totalPrice, 0) // Hitung grandPrice jika diperlukan
      };
    });

    res.status(200).json({ error: false, data: invoicesWithTotalPrice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching invoices', error });
  }
});


// READ (Get Single Invoice by ID)
router.get('/invoices/:id', 
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const invoice = await Invoice.findById(req.params.id).populate('products.productId');
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      // Hitung totalPrice untuk setiap produk
      const productsWithTotalPrice = invoice.products.map(product => ({
        productId: product.productId,
        quantity: product.quantity,
        price: product.productId.price, // Ambil harga dari productId
        totalPrice: product.productId.price * product.quantity // Hitung totalPrice
      }));

      // Kembalikan invoice dengan produk yang sudah dihitung totalPrice-nya
      const invoiceWithTotalPrice = {
        ...invoice.toObject(), // Konversi invoice ke objek biasa
        products: productsWithTotalPrice,
        grandPrice: productsWithTotalPrice.reduce((sum, p) => sum + p.totalPrice, 0) // Hitung grandPrice jika diperlukan
      };

      res.status(200).json(invoiceWithTotalPrice);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching invoice', error });
    }
  }
);


// UPDATE Invoice
router.put('/invoices/:id', 
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('customer').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('tanggalTerima').optional().isISO8601().withMessage('Invalid date format for tanggalTerima'),
  body('tanggalSelesai').optional().isISO8601().withMessage('Invalid date format for tanggalSelesai'),
  body('downPayment').optional().isNumeric().withMessage('Down payment must be a number'),
  body('products').optional().isArray().withMessage('Products must be an array'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const { customer, tanggalTerima, tanggalSelesai, downPayment, products } = req.body;
      const updatedInvoice = await Invoice.findByIdAndUpdate(
        req.params.id,
        {
          customer,
          tanggalTerima,
          tanggalSelesai,
          downPayment,
          products: products.map(product => ({
            productId: product.productId,
            quantity: product.quantity
          })),
          timeStamp: new Date()
        },
        { new: true }
      ).populate('products.productId');

      if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.status(200).json(updatedInvoice);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error updating invoice', error });
    }
  }
);

// DELETE Invoice
router.delete('/invoices/:id', 
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
      if (!deletedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error deleting invoice', error });
    }
  }
);

// Route for generating PDF
router.get('/generate-pdf/:id', 
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, errors: errors.array() });
    }

    try {
      const invoice = await Invoice.findById(req.params.id).populate('products.productId');
      if (!invoice) {
        return res.status(404).json({ error: true, message: 'Invoice not found' });
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Invoice</h1>
            <p><strong>Customer:</strong> ${invoice.customer}</p>
            <p><strong>Tanggal Terima:</strong> ${invoice.tanggalTerima}</p>
            <p><strong>Tanggal Selesai:</strong> ${invoice.tanggalSelesai}</p>
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.products.map((product, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${product.productId.name}</td>
                    <td>${product.quantity}</td>
                    <td>Rp ${product.productId.price}</td>
                    <td>Rp ${product.productId.price * product.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p><strong>Sub Total:</strong> Rp ${invoice.grandPrice}</p>
            <p><strong>DP:</strong> Rp ${invoice.downPayment}</p>
            <p><strong>Total:</strong> Rp ${invoice.grandPrice - invoice.downPayment}</p>
          </body>
        </html>
      `;

      pdf.create(html).toBuffer((err, buffer) => {
        if (err) {
          return res.status(500).json({ error: true, message: 'Error generating PDF', err });
        }

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice._id}.pdf"`,
        });

        res.send(buffer);
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: true, message: 'Error generating PDF', error });
    }
  }
);

module.exports = router;
