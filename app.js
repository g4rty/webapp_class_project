const express = require("express");
const session = require("express-session");
const cors = require("cors"); // Add CORS middleware
const app = express();
const con = require("./config/db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

// Port number
const port = 6500;

// diasable caching
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

app.get("/password/:password", function (req, res) {
    const password = req.params.password;
    bcrypt.hash(password, 10, function (err, hash) {
        if (err) {
            console.error(err);
            return res.status(500).send("Password hashing error");
        }
        res.status(200).send(hash);
    });
})


// ####################################
// Upload Images.
// ####################################

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "public/img"));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});


const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only .png, .jpg, .jpeg allowed'));
        }
        cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 } // Max 10MB
});

app.listen(port, function () {
    console.log("Server is ready at " + port);
});
//----------------------------Middleware----------------------------//
//for json exchange
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//for session 
app.use(session({
    cookie: { maxAge: 24 * 60 * 60 * 1000 },//7 days
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}))

function requireRole(role) {
    return (req, res, next) => {
      // 1) Not logged in → expire
      if (!req.session.userId) {
        return req.session.destroy(err => {
          res.clearCookie("connect.sid");
          res.redirect("/login?expired=1");
        });
      }
  
      // 2) Wrong role → denied
      const ok = Array.isArray(role)
        ? role.includes(req.session.role)
        : req.session.role === role;
      if (!ok) {
        return req.session.destroy(err => {
          res.clearCookie("connect.sid");
          // <<< use denied=1 here >>>
          res.redirect("/login?denied=1");
        });
      }
  
      // 3) All good
      next();
    };
  }
  
// Root directory
app.use(express.static(path.join(__dirname, 'public')));

// Public (no auth needed)
// serve that file:
app.get('/unauthorized', (req, res) => {
res.sendFile(path.join(__dirname, 'views/unauthorized.html'));
});
app.get("/",           (req, res) => res.sendFile(path.join(__dirname, "homepage.html")));
app.get("/login",      (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/register",   (req, res) => res.sendFile(path.join(__dirname, "register.html")));

// STUDENT‑ONLY
app.get("/student/home",    requireRole("student"), (req, res) => res.sendFile(path.join(__dirname, "views/Student/student_home.html")));
app.get("/student/assets",  requireRole("student"), (req, res) => res.sendFile(path.join(__dirname, "views/Student/student_asset_list.html")));
app.get("/student/request", requireRole("student"), (req, res) => res.sendFile(path.join(__dirname, "views/Student/student_request_item.html")));
app.get("/student/history", requireRole("student"), (req, res) => res.sendFile(path.join(__dirname, "views/Student/student_history.html")));

// LECTURER‑ONLY
app.get("/lecturer/home",     requireRole("lecturer"), (req, res) => res.sendFile(path.join(__dirname, "views/Lecturer/lecturer_home.html")));
app.get("/lecturer/request",  requireRole("lecturer"), (req, res) => res.sendFile(path.join(__dirname, "views/Lecturer/lecturer_request_items.html")));
app.get("/lecturer/history",  requireRole("lecturer"), (req, res) => res.sendFile(path.join(__dirname, "views/Lecturer/lecturer_history.html")));
app.get("/lecturer/dashboard",requireRole("lecturer"), (req, res) => res.sendFile(path.join(__dirname, "views/Lecturer/lecturer_dashboard.html")));
app.get("/lecturer/asset",    requireRole("lecturer"), (req, res) => res.sendFile(path.join(__dirname, "views/Lecturer/lecturer_asset_list.html")));

// STAFF‑ONLY
app.get("/staff/home",    requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_home.html")));
app.get("/staff/asset",   requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_asset_list.html")));
app.get("/staff/news",    requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_add_news.html")));
app.get("/staff/dashboard",requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_dashboard.html")));
app.get("/staff/pickup",  requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_pickup_item.html")));
app.get("/staff/return",  requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_return_item.html")));
app.get("/staff/history", requireRole("staff"), (req, res) => res.sendFile(path.join(__dirname, "views/Staff/staff_history.html")));


// #####################################################################################
// LOGIN
// #####################################################################################

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    const sql = `SELECT id, username, password, role FROM users WHERE username = ?`;
    con.query(sql, [username], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }

        if (result.length === 0) {
            return res.status(401).send("Username doesn't exist");
        }

        bcrypt.compare(password, result[0].password, function (err, isMatch) {
            if (err) {
                return res.status(500).send("Authentication Server Error");
            }

            if (isMatch) {
                const user = result[0];

                const roleMap = {
                    1: "staff",
                    2: "lecturer",
                    3: "student"
                };

                const userRoleStr = roleMap[user.role];
                if (!userRoleStr) {
                    return res.status(403).send("Forbidden: Unknown Role");
                }

                req.session.userId = user.id;
                req.session.role = userRoleStr;

                return res.status(200).json({
                    message: `/${userRoleStr}/home`, // For frontend redirect
                    role: userRoleStr,
                    userId: user.id
                });
            } else {
                return res.status(401).send("Wrong password");
            }
        });
    });
});

// #####################################################################################
// REGISTER
// #####################################################################################
app.post("/register", function (req, res) {
    const { first_name, last_name, username, email, password, confirmPassword } = req.body;

    //Check if passwords match before proceeding
    if (password !== confirmPassword) {
        return res.status(400).send("Passwords do not match");
    }

    //Check if username or email already exists before inserting
    const checkSql = `SELECT id FROM users WHERE username = ? OR email = ?`;
    con.query(checkSql, [username, email], function (err, result) {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).send("Database error");
        }

        //If username or email already exists, return 409 Conflict
        if (result.length > 0) {
            return res.status(409).send("Username or email already exists");
        }

        //Hash the password before inserting into the database
        bcrypt.hash(password, 10, function (err, hashedPassword) {
            if (err) {
                console.error(err);
                return res.status(500).send("Password hashing error");
            }

            //Insert user into the database with hashed password
            const sql = `INSERT INTO users (first_name, last_name, username, password, role, email) VALUES (?, ?,?, ?, 3, ?)`;
            con.query(sql, [first_name, last_name, username, hashedPassword, email], function (err, result) {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).send("Database error");
                }

                //If everything succeeds, send success response
                return res.status(200).send("Student registered successfully");
            });
        });
    });
});

// #####################################################################################
// ASSET FOR GET DATA FROM ASSETS DATABASE
// #####################################################################################
app.get("/assets", (req, res) => {
    const sql = "SELECT id, name, image, status, quantity, description FROM assets";

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching assets:", err); // Log the error
            return res.status(500).json({ error: "Failed to fetch asset list" });
        }

        if (results.length === 0) {
            console.warn("No assets found in the database."); // Log a warning if no data
            return res.status(404).json({ message: "No assets found" });
        }

        return res.status(200).json(results);
    });
});

// #####################################################################################
// (STUDENT) for Borrowing assets
// #####################################################################################
app.post("/borrow", (req, res) => {
    const { item_id, reason, borrower_id } = req.body;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (!item_id || !reason || !borrower_id) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    // Step 1: Check if the student already has an active request
    const activeRequestSql = `
      SELECT id FROM borrow_requests 
      WHERE borrower_id = ? 
      AND (status = 'pending' OR (status = 'approved' AND (receiver_id IS NULL OR receiver_id = 0)))
    `;

    con.query(activeRequestSql, [borrower_id], (err, activeResults) => {
        if (err) {
            console.error("Active request check error:", err);
            return res.status(500).json({ error: "Database error during active request check" });
        }

        if (activeResults.length > 0) {
            return res.status(409).json({ error: "You can only request one item at a time. Cancel or complete your current request first." });
        }

        // Step 2: Check if this specific item was already requested today and not cancelled
        const checkSql = `
          SELECT id FROM borrow_requests 
          WHERE asset_id = ? AND borrower_id = ? AND borrow_date = ? 
          AND status != 'cancelled'
        `;

        con.query(checkSql, [item_id, borrower_id, today], (err, results) => {
            if (err) {
                console.error("Check error:", err);
                return res.status(500).json({ error: "Database error during duplicate check" });
            }

            if (results.length > 0) {
                return res.status(409).json({ error: "You've already requested this item today." });
            }

            // Step 3: Insert the new request
            const insertSql = `
                INSERT INTO borrow_requests 
                (asset_id, borrower_id, borrow_date, return_date, request_date, reason, status) 
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `;

            con.query(insertSql, [item_id, borrower_id, today, tomorrowStr, today, reason], (err, result) => {
                if (err) {
                    console.error("Insert error:", err);
                    return res.status(500).json({ error: "Database insert failed" });
                }

                // Step 4: Reduce quantity in assets table
                const updateQtySql = `UPDATE assets SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`;

                con.query(updateQtySql, [item_id], (err) => {
                    if (err) {
                        console.warn("Quantity update warning:", err);
                    }
                    return res.status(200).json({ message: "Request submitted successfully." });
                });
            });
        });
    });
});
// #####################################################################################
// cancel request 
// #####################################################################################
app.post("/cancel-request", (req, res) => {
    const { request_id } = req.body;

    if (!request_id) {
        return res.status(400).json({ error: "Missing request_id" });
    }

    // Step 1: Get the asset_id from the borrow request
    const getAssetSql = `
      SELECT asset_id 
      FROM borrow_requests 
      WHERE id = ? AND status = 'pending';
    `;
    con.query(getAssetSql, [request_id], (err, result) => {
        if (err) {
            console.error("Error fetching asset_id:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: "Request not found or not pending" });
        }

        const asset_id = result[0].asset_id;

        // Step 2: Update the borrow request to 'cancelled'
        const updateRequestSql = `
        UPDATE borrow_requests 
        SET status = 'cancelled' 
        WHERE id = ? AND status = 'pending';
      `;
        con.query(updateRequestSql, [request_id], (err, result) => {
            if (err) {
                console.error("Error cancelling request:", err);
                return res.status(500).json({ error: "Failed to cancel request" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Request not found or not pending" });
            }

            // Step 3: Increase the quantity in the assets table
            const updateQuantitySql = `
          UPDATE assets 
          SET quantity = quantity + 1 
          WHERE id = ?;
        `;
            con.query(updateQuantitySql, [asset_id], (err, result) => {
                if (err) {
                    console.error("Error updating quantity:", err);
                    return res.status(500).json({ error: "Failed to update quantity" });
                }
                res.status(200).json({ message: "Request cancelled successfully, quantity updated" });
            });
        });
    });
});

// #####################################################################################
// STUDENT REQUESTED LIST
// #####################################################################################
app.get("/my-requests", (req, res) => {
    const borrower_id = parseInt(req.query.borrower_id);

    if (!borrower_id) {
        console.error("Missing borrower_id");
        return res.status(400).json({ error: "Missing borrower_id" });
    }

    const sql = `
      SELECT 
        br.id AS request_id,
        a.id AS asset_id,
        a.name AS asset_name,
        a.image AS asset_image,
        br.status,
        br.borrow_date,
        br.return_date,
        br.reason,
        u.username AS approved_by
      FROM borrow_requests br
      JOIN assets a ON br.asset_id = a.id
      LEFT JOIN users u ON br.approve_by_id = u.id
      WHERE br.borrower_id = ? AND br.status = 'pending'
      ORDER BY br.request_date DESC
    `;

    con.query(sql, [borrower_id], (err, results) => {
        if (err) {
            console.error("Error fetching borrow requests:", err);
            return res.status(500).json({ error: "Failed to fetch borrow requests" });
        }

        console.log("Fetched borrow requests:", results);  // Log the query result to debug

        if (results.length === 0) {
            console.log("No pending requests found.");
        }

        res.status(200).json(results);
    });
});

// #####################################################################################
// LECTURER 
// to load all borrow requests

app.post("/my-requests/lecturer", (req, res) => {
    const sql = `
      SELECT 
        br.id AS request_id,
        a.name AS asset_name,
        a.image AS asset_image,
        a.description AS descrp,
        br.status AS status,
        DATE_FORMAT(br.request_date, '%Y-%m-%d') AS request_date,
        DATE_FORMAT(br.return_date, '%Y-%m-%d') AS return_date,
        br.reason,
        u.username AS borrower
      FROM borrow_requests br
      JOIN assets a ON br.asset_id = a.id
      JOIN users u ON br.borrower_id = u.id
      WHERE br.status = ?
      ORDER BY br.request_date DESC;
    `;

    con.query(sql, ['pending'], (err, results) => {
        if (err) {
            console.error('Error selecting:', err);
            return res.status(500).send('Server error');
        }
        return res.status(200).json(results);
    });
});

app.get("/dashboard", (req, res) => {
    const sqls = {
        pending: "SELECT COUNT(*) AS count FROM borrow_requests WHERE status = 'pending'",
        available: "SELECT SUM(quantity) AS count FROM assets WHERE status = 'Available'",
        disabled: "SELECT SUM(quantity) AS count FROM assets WHERE status = 'Disable'",
        borrowed: "SELECT COUNT(*) AS count FROM borrow_requests WHERE status = 'approved' AND receiver_id = 0"
    };

    const results = {};
    const keys = Object.keys(sqls);
    let completed = 0;

    keys.forEach(key => {
        con.query(sqls[key], (err, rows) => {
            if (err) {
                console.error(`Error fetching ${key}:`, err);
                return res.status(500).json({ error: `Error fetching ${key}` });
            }

            results[key] = rows[0].count || 0;
            completed++;

            if (completed === keys.length) {
                res.status(200).json(results);
            }
        });
    });
});


// Fetch all pending borrow requests for lecturers
app.get("/borrow-requests", (req, res) => {
    const sql = `
      SELECT 
        br.id AS request_id,
        a.name AS asset_name,
        a.image AS asset_image,
        br.reason,
        DATE_FORMAT(br.request_date, '%Y-%m-%d') AS request_date,
        u.username AS borrower
      FROM borrow_requests br
      JOIN assets a ON br.asset_id = a.id
      JOIN users u ON br.borrower_id = u.id
      WHERE br.status = 'pending'
      ORDER BY br.request_date DESC;
    `;

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching borrow requests:", err);
            return res.status(500).json({ error: "Failed to fetch borrow requests" });
        }

        return res.status(200).json(results);
    });
});

// Approve a borrow request
app.put("/borrow/:id/approve", (req, res) => {
    const id = req.params.id;
    const { approve_by_id } = req.body;

    const approvalDate = new Date().toISOString().split("T")[0];
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 1); // Set return date to 1 days from today
    const formattedReturnDate = returnDate.toISOString().split("T")[0];

    const sql = `
      UPDATE borrow_requests 
      SET status = 'approved', approve_by_id = ?, return_date = ?, approval_date = ?
      WHERE id = ?
    `;

    con.query(sql, [approve_by_id, formattedReturnDate, approvalDate, id], (err, result) => {
        if (err) {
            console.error("Error approving borrow request:", err);
            return res.status(500).json({ error: "Failed to approve borrow request" });
        }

        return res.status(200).json({ message: "Borrow request approved successfully" });
    });
});

// Reject a borrow request
app.put("/borrow/:id/reject", (req, res) => {
    const id = req.params.id;
    const { approve_by_id, rejection_reason } = req.body;

    const approvalDate = new Date().toISOString().split("T")[0];

    if (!rejection_reason || rejection_reason.trim() === "") {
        return res.status(400).json({ error: "Rejection reason is required" });
    }

    const sql = `
      UPDATE borrow_requests 
      SET status = 'rejected', approve_by_id = ?, rejection_reason = ?, approval_date = ?
      WHERE id = ?
    `;

    con.query(sql, [approve_by_id, rejection_reason, approvalDate, id], (err, result) => {
        if (err) {
            console.error("Error rejecting borrow request:", err);
            return res.status(500).json({ error: "Failed to reject borrow request" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Borrow request not found" });
        }

        return res.status(200).json({ message: "Borrow request rejected successfully" });
    });
});

// ########################################################
// history
// ########################################################


app.get("/history", (req, res) => {
    const role = req.query.role;
    const userId = parseInt(req.query.userId);

    if (!role || isNaN(userId)) {
        return res.status(400).json({ error: "Missing or invalid role or userId" });
    }

    let sql = "";
    let params = [];

    if (role === "staff") {
        sql = `
            SELECT 
                br.id,
                a.name,
                a.image,
                br.borrow_date,
                br.return_date,
                br.returned_date,
                br.status,
                br.rejection_reason,
                CONCAT(u1.first_name, ' ', u1.last_name) AS approved_by,
                CONCAT(u2.first_name, ' ', u2.last_name) AS borrower,
                CONCAT(u3.first_name, ' ', u3.last_name) AS received_by
            FROM borrow_requests br
            JOIN assets a ON br.asset_id = a.id
            LEFT JOIN users u1 ON br.approve_by_id = u1.id
            JOIN users u2 ON br.borrower_id = u2.id
            LEFT JOIN users u3 ON br.receiver_id = u3.id
            WHERE br.status IN ('approved', 'returned', 'rejected')
            ORDER BY br.borrow_date DESC;
        `;
    } else if (role === "lecturer") {
        sql = `
            SELECT 
                br.id,
                a.name,
                a.image,
                br.borrow_date,
                br.return_date,
                br.returned_date,
                br.status,
                br.rejection_reason,
                DATE_FORMAT(br.approval_date, '%Y-%m-%d') AS approval_date,
                u2.username AS approved_by,
                u.username AS borrower,
                a.name AS asset_name
            FROM borrow_requests br
            JOIN assets a ON br.asset_id = a.id
            JOIN users u ON br.borrower_id = u.id
            LEFT JOIN users u2 ON br.approve_by_id = u2.id
            WHERE br.approve_by_id = ? AND br.status IN ('approved', 'rejected')
        `;
        params = [userId];
    } else if (role === "student") {
        sql = `
            SELECT 
                br.id,
                a.name,
                a.image,
                br.borrow_date,
                br.return_date,
                br.returned_date,
                br.status,
                br.rejection_reason,
                br.approve_by_id,
                br.receiver_id,
                br.handover_by_id,
                u.username AS approved_by
            FROM borrow_requests br
            JOIN assets a ON br.asset_id = a.id
            LEFT JOIN users u ON br.approve_by_id = u.id
            WHERE br.borrower_id = ? AND br.status IN ('approved', 'rejected', 'cancelled')
        `;
        params = [userId];
    } else {
        return res.status(403).json({ error: "Invalid role provided" });
    }

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error fetching history:", err);
            return res.status(500).json({ error: "Failed to fetch history data" });
        }
        res.status(200).json(results);
    });
});

// ########################################################
// toggle status
// ########################################################

app.post("/asset/:id/toggle_status", (req, res) => {
    const assetId = parseInt(req.params.id);
    const { status } = req.body;

    if (!["Available", "Disable"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const sql = `UPDATE assets SET status = ? WHERE id = ?`;

    con.query(sql, [status, assetId], (err, result) => {
        if (err) {
            console.error("Error updating asset status:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        return res.json({ success: true, message: "Status updated successfully" });
    });
});

// Edit Asset Info
app.post("/asset/update/:id", upload.single("image"), (req, res) => {
    const id = parseInt(req.params.id);
    const { name, quantity, status } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!id || !name || quantity === undefined || !["Available", "Pending", "Borrowed", "Disable"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid input" });
    }

    let sql, values;
    if (image) {
        sql = `UPDATE assets SET name = ?, quantity = ?, status = ?, image = ? WHERE id = ?`;
        values = [name, quantity, status, image, id];
    } else {
        sql = `UPDATE assets SET name = ?, quantity = ?, status = ? WHERE id = ?`;
        values = [name, quantity, status, id];
    }

    con.query(sql, values, (err, result) => {
        if (err) {
            console.error("Update asset error:", err);
            return res.status(500).json({ success: false, message: "Database update error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Asset not found" });
        }

        return res.status(200).json({ success: true });
    });
});

app.post("/asset/add", upload.single("image"), (req, res) => {
    const { name, type, quantity, status } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !type || !quantity || !status) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const sql = `INSERT INTO assets (name, description, quantity, status, image) VALUES (?, ?, ?, ?, ?)`;

    con.query(sql, [name, type, quantity, status, image], (err) => {
        if (err) {
            console.error("Insert asset error:", err);
            return res.status(500).json({ success: false, message: "Database insert error" });
        }
        return res.status(200).json({ success: true });
    });
});

// ##################################################################################################################
// Handover_By API
// ##################################################################################################################

app.post("/handover/:id", (req, res) => {
    const requestId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId || !requestId) {
        return res.status(400).json({ success: false, message: "Missing data" });
    }

    const sql = `UPDATE borrow_requests SET handover_by_id = ? WHERE id = ?`;
    con.query(sql, [userId, requestId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        return res.json({ success: true, message: "Handover recorded successfully" });
    });
});

// ##################################################################################################################
// Handover_asset_show
// ##################################################################################################################

app.get("/handover-requests", (req, res) => {
    const sql = `
    SELECT 
      br.id AS request_id,
      a.name AS asset_name,
      a.image AS asset_image,
      u.username AS borrower,
      br.borrow_date,
      br.return_date,
      br.reason,
      br.handover_by_id,
      br.approve_by_id,
      approver.first_name AS approved_by_name
    FROM borrow_requests br
    JOIN assets a ON br.asset_id = a.id
    JOIN users u ON br.borrower_id = u.id
    LEFT JOIN users approver ON br.approve_by_id = approver.id
    WHERE br.status = 'approved' 
      AND (br.handover_by_id IS NULL OR br.handover_by_id = 0)
      AND br.approve_by_id IS NOT NULL
    ORDER BY br.borrow_date DESC
  `;

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching handover requests:", err);
            return res.status(500).json({ error: "Failed to fetch handover requests" });
        }

        return res.status(200).json(results);
    });
});
/* app.get("/handover-requests", (req, res) => {
    const sql = `
      SELECT 
        br.id AS request_id,
        a.name AS asset_name,
        a.image AS asset_image,
        u.username AS borrower,
        br.borrow_date,
        br.return_date,
        br.reason,
        br.handover_by_id,
        br.approve_by_id
      FROM borrow_requests br
      JOIN assets a ON br.asset_id = a.id
      JOIN users u ON br.borrower_id = u.id
      WHERE br.status = 'approved' 
        AND (br.handover_by_id IS NULL OR br.handover_by_id = 0)
        AND br.approve_by_id IS NOT NULL
      ORDER BY br.borrow_date DESC
    `;
  
    con.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching handover requests:", err);
        return res.status(500).json({ error: "Failed to fetch handover requests" });
      }
  
      return res.status(200).json(results);
    });
  }); */

// ##################################################################################################################
// return
// ##################################################################################################################

app.get("/return-requests", (req, res) => {
    const sql = `
      SELECT 
        br.id AS request_id,
        a.name AS asset_name,
        a.image AS asset_image,
        u.username AS borrower_username,
        u.first_name AS borrower_first_name,
        u.last_name AS borrower_last_name,
        br.borrow_date,
        br.return_date,
        br.reason,
        br.handover_by_id,
        br.approve_by_id,
        approver.first_name AS approved_by_name,
        handover.first_name AS handover_by_name
      FROM borrow_requests br
      JOIN assets a ON br.asset_id = a.id
      JOIN users u ON br.borrower_id = u.id
      LEFT JOIN users approver ON br.approve_by_id = approver.id
      LEFT JOIN users handover ON br.handover_by_id = handover.id
      WHERE br.status = 'approved'
        AND (br.handover_by_id IS NOT NULL AND br.handover_by_id != 0)
        AND (br.receiver_id IS NULL OR br.receiver_id = 0)
      ORDER BY br.borrow_date DESC
    `;

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching return requests:", err);
            return res.status(500).json({ error: "Failed to fetch return requests" });
        }

        return res.status(200).json(results);
    });
});

app.post("/return/:id", (req, res) => {
    const requestId = parseInt(req.params.id);
    const { userId } = req.body;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Step 1: Get asset_id from the borrow request
    const getAssetSql = `SELECT asset_id FROM borrow_requests WHERE id = ?`;

    con.query(getAssetSql, [requestId], (err, result) => {
        if (err) {
            console.error("Error fetching asset_id:", err);
            return res.status(500).json({ success: false, message: "Error fetching asset info" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Borrow request not found" });
        }

        const assetId = result[0].asset_id;

        // Step 2: Update borrow_requests to mark returned
        const updateReturnSql = `
        UPDATE borrow_requests 
        SET receiver_id = ?, returned_date = ? 
        WHERE id = ?
      `;

        con.query(updateReturnSql, [userId, today, requestId], (err, result) => {
            if (err) {
                console.error("Error updating borrow request:", err);
                return res.status(500).json({ success: false, message: "Failed to mark as returned" });
            }

            // Step 3: Increase asset quantity
            const updateQtySql = `
          UPDATE assets SET quantity = quantity + 1 WHERE id = ?
        `;

            con.query(updateQtySql, [assetId], (err, result) => {
                if (err) {
                    console.error("Error increasing asset quantity:", err);
                    return res.status(500).json({ success: false, message: "Failed to increase quantity" });
                }

                // Step 4: Set status to 'Available' if quantity > 0
                const updateStatusSql = `
            UPDATE assets SET status = 'Available' WHERE id = ? AND quantity > 0
          `;

                con.query(updateStatusSql, [assetId], (err, result) => {
                    if (err) {
                        console.error("Error updating asset status:", err);
                        return res.status(500).json({ success: false, message: "Quantity updated but failed to update status" });
                    }

                    return res.status(200).json({ success: true, message: "Item returned, quantity updated, and status checked." });
                });
            });
        });
    });
});

app.post('/upload/news', upload.single('image'), (req, res) => {
    const image = req.file.filename;

    const sql = `INSERT INTO news (image) VALUES (?)`;
    con.query(sql, [image], (err, result) => {
        if (err) {
            console.error("Insert error:", err);
            return res.status(500).json({ error: "Database insert failed" });
        }

        res.status(200).json({
            message: "Upload successful",
            imageUrl: `/img/${image}`,
            id: result.insertId
        });
    });
});

app.delete('/news/:id', (req, res) => {
    const newsId = req.params.id;

    const selectSql = `SELECT image FROM news WHERE id = ?`;
    con.query(selectSql, [newsId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'News item not found.' });
        }

        const imageName = results[0].image;
        const imagePath = path.join(__dirname, 'public', 'img', imageName); // ✅ Correct path

        // Delete file
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.warn('Image file delete warning:', err.message);
                // Continue anyway
            }

            // Delete database row
            const deleteSql = `DELETE FROM news WHERE id = ?`;
            con.query(deleteSql, [newsId], (err2) => {
                if (err2) {
                    return res.status(500).json({ error: 'Failed to delete database row.' });
                }
                res.json({ message: 'News and image deleted successfully.' });
            });
        });
    });
});


app.get('/news', (req, res) => {
    const sql = `SELECT id, image FROM news ORDER BY id DESC`;

    con.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching news:", err);
            return res.status(500).json({ error: "Failed to fetch news" });
        }

        res.status(200).json(results);
    });
});