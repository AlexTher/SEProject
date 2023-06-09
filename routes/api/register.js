const express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const User = require('../../models/User');
const Class = require('../../models/Class');
const Timestamp = require('../../models/Timestamp');

router.post('/waitlist', isLoggedIn, async (req, res) => {
    console.log(req.body);
    try {
        const classId  = mongoose.Types.ObjectId(req.body.classId);
        const userId = req.session.user._id

        const savedUser = await addToWishlist(userId, classId);
        console.log(savedUser.message);
    } catch (err) {
        // Handle errors
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/add', isLoggedIn, async (req, res) => {
    console.log(req.body);
    try {
        const classId  = mongoose.Types.ObjectId(req.body.classId);
        const userId = req.session.user._id

        const savedUser = await addToList(userId, classId);
        console.log(savedUser.message);
        res.send(savedUser.message);
    } catch (err) {
        // Handle errors
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/remove', isLoggedIn, async (req, res) => {
  console.log(req.body);
  try {
    const classId  = mongoose.Types.ObjectId(req.body.classId);
    const userId = req.session.user._id

    const removedClass = await removeFromList(userId, classId);
    console.log(removedClass.message);
    res.send(removedClass.message);
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

function isLoggedIn(req, res, next) {
    if (req.session.user) {
      next(); // Continue to the next function
    } else {
      res.status(401).send('Unauthorized');
    }
  }

// Add a class to the wishlist of a student
async function addToWishlist(studentId, classId) {
  try {
    console.log("\nLooking for user " + studentId + "\n");

    const student = await User.findById(studentId);
    const classObj = await Class.findById(classId).exec();

    console.log("\nAdding " + classObj + " to " + student.name + "'s Wishlist\n");


    // Check if the class is already in the student's wishlist or class list
    if ((student.wishlist && student.wishlist.includes(classId)) || student.class.includes(classId)) {
      throw new Error('The class is already in the student\'s list.');
    }

    // Add the class ID to the student's wishlist array
    student.wishlist.push(classObj);

    // Save the updated student document to the User collection
    await student.save();

    return {
      success: true,
      message: `The class ${classObj} has been added to the waitlist of ${student.name}.`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

async function addToList(studentId, classId) {
    try {
      console.log("\nLooking for user " + studentId + "\n");
  
      const student = await User.findById(studentId);
      const classObj = await Class.findById(classId);
      const newTimestamp = new Timestamp({
        user: student._id,
        class: classObj._id,
        student: student._id,
        description: 'student_registered'
    });
  
      console.log("\nAdding " + classObj + " to " + student.name + "'s Class List\n");

      // Check if the class is already in the student's wishlist
      if (student.wishlist && !student.wishlist.includes(classId)) {
        throw new Error('The class is somehow not in the student\'s wishlist.');
      }
  
      // Check if the class is already in the student's class list
      if (student.class && student.class.includes(classId)) {
        throw new Error('The class is already in the student\'s list.');
      }
  
      // Add the class ID to the student's class array
      student.class.push(classObj);

      //Remove the class from the wishlist
      student.wishlist.pull(classObj);
      
      // Save timestamp
      await newTimestamp.save();
  
      // Save the updated student document to the User collection
      await student.save();

      // window.location.reload();
      // alert(`The class ${classObj} has been added to ${student.name}'s class list.`);
  
      return {
        success: true,
        message: `The class ${classObj} has been added to ${student.name}'s class list.`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async function removeFromList(studentId, classId) {
    try {
      console.log("\nLooking for user " + studentId + "\n");
  
      const student = await User.findById(studentId);
      const classObj = await Class.findById(classId);
      const newTimestamp = new Timestamp({
        user: student._id,
        class: classObj._id,
        student: student._id,
        description: 'student_unregistered'
      });
  
      console.log("\nRemoving " + classObj + " from " + student.name + "'s Class List\n");
  
      // Check if the class is already in the student's wishlist
      if (student.wishlist && student.wishlist.includes(classId)) {
        throw new Error('The class is in the student\'s wishlist.');
      }
  
      // Check if the class is already in the student's class list
      if (!student.class || !student.class.includes(classId)) {
        throw new Error('The class is not in the student\'s list.');
      }
  
      // Remove the class ID from the student's class array
      student.class.pull(classObj);
  
      // Save timestamp
      await newTimestamp.save();
  
      // Save the updated student document to the User collection
      await student.save();
  
      return {
        success: true,
        message: `The class ${classObj} has been removed from ${student.name}'s class list.`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

module.exports = router;