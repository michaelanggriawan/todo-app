const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

const Todo = require('../models/Todo');

// @route     GET todo/all
// @desc      Get all users todo
// @access    Private

router.get('/all', auth, async (req, res) => {
  try {
    console.log(req.user.id);
    const todos = await Todo.find({ user: req.user.id }).sort({
      date: -1,
    });
    console.log(todos);
    res.json(todos);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     POST todo/add
// @desc      Post user todo
// @access    Private

router.post(
  '/add',
  auth,
  [
    check('task', 'Task is required').not().isEmpty(),
    check('status', 'Status is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task, status } = req.body;

    try {
      const newTodo = new Todo({
        task,
        status,
        user: req.user.id,
      });

      const todo = await newTodo.save();

      res.json(todo);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  },
);

// @route     PUT todo/:id
// @desc      Update user todo
// @access    Private
router.put('/:id', auth, async (req, res) => {
  const { task, status } = req.body;

  // Build todo object
  const todoFields = {};
  if (task) todoFields.task = task;
  if (status) todoFields.status = status;

  try {
    let todo = await Todo.findById(req.params.id);

    if (!todo) return res.status(404).json({ msg: 'To do not found' });

    // Make sure owns todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    todo = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: todoFields },
      { new: true },
    );

    res.json(todo);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route     DELETE todo/:id
// @desc      Delete todo
// @access    Private
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(req.params.id)
    let todo = await Todo.findById(req.params.id);

    if (!todo) return res.status(404).json({ msg: 'Todo not found' });

    // Make sure owns todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Todo.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Todo removed' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
