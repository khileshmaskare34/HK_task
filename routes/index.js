var express = require('express');
var router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/add_user', function(req, res, next) {
  res.render('add_user');
});


router.post('/add_user', async function(req, res) {
  try {
    const saved_User = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });

    if (saved_User) {
      res.send(`
        <script>
        alert("Email already registered");
        window.location.href = "/add_user"; 
        </script>
      `);
    } else {
      const new_User = await prisma.user.create({
        data: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
        },
      });

      res.send(`
        <script>
        alert("User added successfully");
        window.location.href = "/";
        </script>
      `);
    }
  } catch (error) {
    console.log("err/add_user", error)
  }
});

router.get('/add_task', async function(req, res) {
  const users = await prisma.user.findMany();
  res.render('add_task', {users});
});

router.post("/add_task", async (req, res) => {
  const { user, task_name, task_type } = req.body;

  try {
    const created_Task = await prisma.task.create({
      data: {
        task_name,
        task_type,
        user: { connect: { id: parseInt(user) } },
      },
    });

     res.send(`
      <script>
      alert("Task added successfully");
      window.location.href = "/";
      </script>
     `);
  } catch (error) {
    console.log("err /add_task", error);
  }
});


router.get('/export_excel', async function(req, res, next) {
  try {
    const users = await prisma.user.findMany();
    const tasks = await prisma.task.findMany();
    const workbook = new ExcelJS.Workbook();
    
    const userSheet = workbook.addWorksheet('Users');
    userSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
    ];
    users.forEach(user => {
      userSheet.addRow({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    });

    const taskSheet = workbook.addWorksheet('Tasks');
    taskSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'User ID', key: 'userId', width: 10 },
      { header: 'Task Name', key: 'task_name', width: 30 },
      { header: 'Task Type', key: 'task_type', width: 15 },
    ];
    tasks.forEach(task => {
      taskSheet.addRow({
        id: task.id,
        userId: task.userId,
        task_name: task.task_name,
        task_type: task.task_type,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="users_and_tasks.xlsx"');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
