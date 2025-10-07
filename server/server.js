const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./work.sqlite');
const delta = 100000000000;

app.post('/getworks', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log('Получена локация от клиента:', latitude, longitude);

  db.all(
    `SELECT * FROM shifts WHERE 
     latitude BETWEEN ? AND ? AND 
     longitude BETWEEN ? AND ?`,
    [latitude - delta, latitude + delta, longitude - delta, longitude + delta],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Ошибка при получении данных из базы данных');
      }
      res.json(rows);
    }
  );
});

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});
