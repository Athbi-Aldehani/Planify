// ======================
// Global variables
// ======================
const collegeMajors = {
    "College of Engineering": [
      "Industrial Engineering",
      "Biomedical Engineering", 
      "Electrical Engineering",
      "Computer Engineering",
      "Cybersecurity and Computer Science",
      "Architecture and Design",
      "Civil and Architectural Engineering"
    ],
    "College of Business": [
      "Accounting",
      "Information Systems",
      "Finance and Financial Technology",
      "Supply Chain Management and Logistics",
      "Banking and Investment Management",
      "Healthcare Management",
      "Marketing"
    ],
    "College of Arts": [
      "English Language",
      "Communication Sciences and Disorders",
      "Media",
      "Sociology",
      "Social Services"
    ]
  };
  let courseData = [];
  const addedSections = [];
  const removedSections = [];
  
  // ======================
  // Making the body of the timetable
  // ======================
  function generateTimetable() {
    const timetableBody = document.querySelector('.timetable tbody');
    timetableBody.innerHTML = '';
  
    for (let hour = 8; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const isSharpTime = minute === 0;
            const isHalfHour = minute === 30;
            
            const row = document.createElement('tr');
            // Mark rows for special styling 
            row.dataset.sharpTime = isSharpTime;
            row.dataset.halfHour = isHalfHour;
            
            // Only show label for sharp times
            const displayTime = isSharpTime ? 
                `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}` : '';
            
            row.innerHTML = `
                <td class="time-column">${displayTime}</td>
                <td data-day="0" data-time="${timeString}"></td>
                <td data-day="1" data-time="${timeString}"></td>
                <td data-day="2" data-time="${timeString}"></td>
                <td data-day="3" data-time="${timeString}"></td>
                <td data-day="4" data-time="${timeString}"></td>
            `;
            
            // Center-align the time label vertically
            if (isSharpTime) {
                const timeCell = row.querySelector('.time-column');
                timeCell.style.lineHeight = '20px';
            }
            
            timetableBody.appendChild(row);
        }
    }
  }
  
  
  // =========================
  // Course management section
  // =========================
  function addCourseToTimetable(course) {
    course.sections.forEach(section => {
        const [startTime, endTime] = section.Time.split('-');
        const durationMinutes = (new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / 60000;
        const height = `${(durationMinutes / 10) * 20}px`;

        section.Days.split('').forEach(day => {
            const dayNum = { 'S':0, 'M':1, 'T':2, 'W':3, 'U':4 }[day];
            const cell = document.querySelector(`td[data-day="${dayNum}"][data-time="${startTime}"]`);
            if (!cell) return;
            
            // Check if we need to create a stack container (used to contain more than one course in one time cell)
            let stackContainer = cell.querySelector('.stack-container');
            if (!stackContainer) {
                stackContainer = document.createElement('div');
                stackContainer.className = 'stack-container';
                stackContainer.style.height = height;
                cell.appendChild(stackContainer);
            }

            // Create course element
            const courseElement = document.createElement('div');
            courseElement.className = 'course-cell stacked';
            courseElement.style.height = '100%';
            courseElement.innerHTML = `<div class="course-content">${section.Section}: ${course.courseTitle}</div>`;
            courseElement.dataset.courseId = course.courseCode;
            courseElement.dataset.section = section.Section;
            stackContainer.appendChild(courseElement);
            updateStackLayout(stackContainer);

            courseElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseDetails(course, section, courseElement);
            });
        });
        // Update tracking
        if (!addedSections[course.courseCode]) {
            addedSections[course.courseCode] = [];
        }
        addedSections[course.courseCode].push(section);
    });
    updateAddButtonState(course.courseCode);
}
  ////////

  function updateStackLayout(stackContainer) {
    const courseElements = stackContainer.querySelectorAll('.course-cell');
    const count = courseElements.length;
    
    if (count > 1) {
        // if there is more than one course then set each course to take the same width
        const width = 100 / count;
        courseElements.forEach((el, index) => {
            el.style.width = `${width}%`;
            el.style.left = `${index * width}%`;
            el.classList.add('stacked');
        });
    } else if (count === 1) {
        // if there is only one course in the stack then take the full width
        courseElements[0].style.width = '100%';
        courseElements[0].style.left = '0';
        courseElements[0].classList.remove('stacked');
    }
  }
  ///////

  // Opostite to the addCourseToTimetable

  function removeCourseFromTimetable(courseId) {
    // Remove all instances of this course from timetable
    document.querySelectorAll(`[data-course-id="${courseId}"]`).forEach(el => {
        const stackContainer = el.closest('.stack-container');
        el.remove();
        
        // If stack container exists and is now empty, then remove it
        if (stackContainer && stackContainer.children.length === 0) {
            stackContainer.remove();
        } else if (stackContainer) {
            // Otherwise update the layout of remaining courses
            updateStackLayout(stackContainer);
        }
    });
    
    // Also remove any sections of this course from the removed sections panel
    const removedSectionsPanel = document.getElementById('removed-sections-panel');
    const removedItems = removedSectionsPanel.querySelectorAll('.removed-section-item');
    
    removedItems.forEach(item => {
        const sectionText = item.querySelector('span').textContent;
        // Check if this removed section belongs to the course being removed
        if (sectionText.startsWith(courseId)) {
            item.remove();
        }
    });
    
    delete addedSections[courseId];
}
//////

  function removeSection(course, section, element) {
    // Remove all instances of this section
    document.querySelectorAll(
        `.course-cell[data-course-id="${course.courseCode}"][data-section="${section.Section}"]`
    ).forEach(el => {
        const stackContainer = el.closest('.stack-container');
        el.remove();
        
        // If stack container exists and is now empty, remove it
        if (stackContainer && stackContainer.children.length === 0) {
            stackContainer.remove();
        } else if (stackContainer) {
            // Otherwise update the layout of remaining courses
            updateStackLayout(stackContainer);
        }
    });
    
    document.getElementById('floating-course-details').style.display = 'none';
    document.removeEventListener('click', handleClickOutside);
  
    // Update tracking
    if (addedSections[course.courseCode]) {
        addedSections[course.courseCode] = addedSections[course.courseCode].filter(
            s => s.Section !== section.Section
        );
        if (addedSections[course.courseCode].length === 0) {
            delete addedSections[course.courseCode];
        }
    }
  
    // Add to removed panel if not already there
    const existingRemoved = Array.from(document.querySelectorAll('.removed-section-item span'))
        .some(span => span.textContent.includes(`${course.courseCode} - ${section.Section}`));
    
    if (!existingRemoved) {
        const item = document.createElement('div');
        item.className = 'removed-section-item';
        item.innerHTML = `
            <span>${course.courseCode} - ${section.Section}</span>
            <button class="restore-btn">Restore</button>
        `;
        
        item.querySelector('.restore-btn').addEventListener('click', () => {
            item.remove();
            restoreSection(course, section);
        });
        
        document.getElementById('removed-sections-panel').appendChild(item);
    }
  }

///////

  function restoreSection(course, section) {
    const sectionsToRestore = course.sections.filter(s => s.Section === section.Section);
    sectionsToRestore.forEach(sectionToRestore => {
        const [startTime, endTime] = sectionToRestore.Time.split('-');
        const durationMinutes = (new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / 60000;
        const height = `${(durationMinutes / 10) * 20}px`;
  
        sectionToRestore.Days.split('').forEach(day => {
            const dayNum = { 'S':0, 'M':1, 'T':2, 'W':3, 'U':4 }[day];
            const cell = document.querySelector(`td[data-day="${dayNum}"][data-time="${startTime}"]`);
            if (!cell) return;
            
            // Check if we need to create a stack container
            let stackContainer = cell.querySelector('.stack-container');
            if (!stackContainer) {
                stackContainer = document.createElement('div');
                stackContainer.className = 'stack-container';
                stackContainer.style.height = height;
                cell.appendChild(stackContainer);
            }
  
            // Check if already exists
            if (stackContainer.querySelector(`[data-section="${sectionToRestore.Section}"]`)) return;
  
            // Create course element
            const courseElement = document.createElement('div');
            courseElement.className = 'course-cell stacked';
            courseElement.style.height = '100%';
            courseElement.innerHTML = `<div class="course-content">${sectionToRestore.Section}: ${course.courseTitle}</div>`;
            courseElement.dataset.courseId = course.courseCode;
            courseElement.dataset.section = sectionToRestore.Section;
            stackContainer.appendChild(courseElement);
            updateStackLayout(stackContainer);
            
            courseElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseDetails(course, sectionToRestore, courseElement);
            });
        });
  
        // Update tracking
        if (!addedSections[course.courseCode]) {
            addedSections[course.courseCode] = [];
        }
        addedSections[course.courseCode].push(sectionToRestore);
    });
    updateAddButtonState(course.courseCode);
    }
  
  // ======================
  // Course display section
  // ======================
  function populateCourses(data, selectedMajor) {
      const collegeDropdown = document.getElementById('college-dropdown');
      const selectedCollege = collegeDropdown.value;
      
      const categoryStates = {};
      document.querySelectorAll('.category-group').forEach(group => {
          const title = group.querySelector('.category-title').textContent;
          const isActive = group.querySelector('.category-content').classList.contains('active');
          categoryStates[title] = isActive;
      });
  
      // Filter courses for each category
      const categories = {
          "General Education": data.filter(c => c.group === "General Education"),
          "College Based Requirements": selectedCollege ? 
              data.filter(c => 
                  c.group.includes(selectedCollege.replace("College of ", "")) && 
                  !c.group.includes("Major")
              ) : [],
          "Compulsory Courses": selectedMajor ? 
              data.filter(c => 
                  c.group === "Compulsory Courses" && 
                  c.courseMajors && 
                  c.courseMajors.includes(selectedMajor)
              ) : [],
          "Elective Courses": selectedMajor ? 
              data.filter(c => 
                  c.group === "Elective Courses" && 
                  c.courseMajors && 
                  c.courseMajors.includes(selectedMajor)
              ) : [],
          "Capstone": selectedMajor ?
              data.filter(c => 
                  c.group === "Capstone" &&
                  c.courseMajors &&
                  c.courseMajors.includes(selectedMajor)
              ) : []
      };
  
      // Update each category
      document.querySelectorAll('.category-group').forEach(group => {
          const titleElement = group.querySelector('.category-title');
          const contentDiv = group.querySelector('.category-content');
          const title = titleElement.textContent;
          contentDiv.innerHTML = '';
          
          let courses = [];
          
          // Match category title with our filtered data
          if (title.includes("General Education")) {
              courses = categories["General Education"];
          } else if (title.includes("Requirements")) {
              courses = categories["College Based Requirements"];
          } else if (title.includes("Compulsory")) {
              courses = categories["Compulsory Courses"];
          } else if (title.includes("Elective")) {
              courses = categories["Elective Courses"];
          } else if (title.includes("Capstone")) {
              courses = categories["Capstone"];
          }
          
          // Determine if we should populate this category
          let shouldPopulate = false;
          
          if (title.includes("General Education")) {
              // Always show General Education
              shouldPopulate = true;
          } else if (title.includes("Requirements")) {
              // Show college requirements if college is selected
              shouldPopulate = selectedCollege !== "";
          } else {
              // Show major specific categories if major is selected
              shouldPopulate = selectedMajor !== "";
          }
          
          // Populate the category if conditions are met
          if (shouldPopulate && courses && courses.length > 0) {
              courses.forEach(course => {
                  const item = document.createElement('div');
                  item.className = 'course-item';
                  item.innerHTML = `
                      <div class="course-title">${course.courseCode}: ${course.courseTitle}</div>
                      <button class="add-button">
                          <span class="symbol plus">+</span>
                          <span class="symbol x">×</span>
                      </button>
                  `;
                  contentDiv.appendChild(item);
              });
              
              if (categoryStates[title] !== undefined) {
                  titleElement.classList.toggle('active', categoryStates[title]);
                  contentDiv.classList.toggle('active', categoryStates[title]);
              }
          } else {
              titleElement.classList.remove('active');
              contentDiv.classList.remove('active');
          }
      });
      
      // Update add button states
      Object.keys(addedSections).forEach(courseCode => {
          updateAddButtonState(courseCode);
      });
  }
  
  // ======================================
  // Course details section (floating card)
  // ======================================
  function showCourseDetails(course, section, element) {
    const floatingCard = document.getElementById('floating-course-details');
    floatingCard.innerHTML = `
        <div class="floating-card-content">
            <h3>${section.Section}: ${course.courseTitle}</h3>
            <p><strong>Course:</strong> ${course.courseTitle}</p>
            <p><strong>Faculty:</strong> ${section.Faculty}</p>
            <p><strong>Location:</strong> ${section.Room}</p>
            <button id="remove-section-btn">Remove Section</button>
        </div>
    `;
  
    // Center the card on screen
    floatingCard.style.position = 'fixed';
    floatingCard.style.top = '50%';
    floatingCard.style.left = '50%';
    floatingCard.style.transform = 'translate(-50%, -50%)';
    floatingCard.style.display = 'block';
  
    document.addEventListener('click', handleClickOutside);
    floatingCard.addEventListener('click', e => e.stopPropagation());
    
    document.getElementById('remove-section-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        removeSection(course, section, element);
    });
  }
  
  function handleClickOutside(event) {
    const floatingCard = document.getElementById('floating-course-details');
    if (floatingCard.style.display === 'block' && 
        !floatingCard.contains(event.target) &&
        !event.target.classList.contains('course-cell')) {
        floatingCard.style.display = 'none';
        document.removeEventListener('click', handleClickOutside);
    }
  }
  
  // ==================
  // A helping function
  // ==================
  function updateAddButtonState(courseCode) {
    document.querySelectorAll('.course-item').forEach(item => {
        const courseTitle = item.querySelector('.course-title').textContent;
        // More robust course code extraction (handles codes with numbers)
        const codeMatch = courseTitle.match(/^[A-Z]+\d+/); 
        if (!codeMatch || codeMatch[0] !== courseCode) return;
        
        const btn = item.querySelector('.add-button');
        const course = courseData.find(c => c.courseCode === courseCode);
        
        if (!course) {
            console.warn(`Course ${courseCode} not found in data`);
            return;
        }
        
        // Check if ALL sections are added (for complete course addition)
        const allAdded = course.sections.every(section => 
            addedSections[courseCode]?.some(added => added.Section === section.Section)
        );
        
        // Check if ANY sections are added (for visual feedback)
        const anyAdded = course.sections.some(section => 
            addedSections[courseCode]?.some(added => added.Section === section.Section)
        );
        
        // Toggle visual state
        btn.classList.toggle('added', allAdded);
        
        // Additional visual feedback for partial adds
        btn.classList.toggle('partially-added', anyAdded && !allAdded);
    });
  }
  
// ======================
// Authentication function
// ======================
let currentUser = null;

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authModal = document.getElementById('auth-modal');
const userProfile = document.getElementById('user-profile');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const savedSchedulesContainer = document.getElementById('saved-schedules-container');

// Show auth UI based on login state
function updateAuthUI() {
    if (currentUser) {
        // User is logged in
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        userProfile.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        savedSchedulesContainer.style.display = 'block';
        loadSavedSchedules();
    } else {
        // User is logged out
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        userProfile.style.display = 'none';
        savedSchedulesContainer.style.display = 'none';
    }
}

// Modal and Tab Functionality
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Deactivate all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Activate selected tab and button
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
}

// User Management
const users = JSON.parse(localStorage.getItem('planify_users')) || [];

function findUserByEmail(email) {
    return users.find(user => user.email === email);
}

function saveUsers() {
    localStorage.setItem('planify_users', JSON.stringify(users));
}

function createUser(username, email, password) {
    // Check if user already exists
    if (findUserByEmail(email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password, 
        savedSchedules: []
    };
    
    users.push(newUser);
    saveUsers();
    
    return { success: true, user: newUser };
}

function loginUser(email, password) {
    const user = findUserByEmail(email);
    
    if (!user || user.password !== password) {
        return { success: false, message: 'Invalid email or password' };
    }
    
    // Set current user and save to session
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    return { success: true, user };
}

function logoutUser() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    updateAuthUI();
}

// Check if user is already logged in from session
function checkLoggedInUser() {
    const sessionUser = sessionStorage.getItem('currentUser');
    if (sessionUser) {
        currentUser = JSON.parse(sessionUser);
        updateAuthUI();
    }
}

// =========================
// Schedule saving functions
// =========================
const saveScheduleBtn = document.getElementById('save-schedule-btn');
const saveScheduleModal = document.getElementById('save-schedule-modal');
const saveScheduleForm = document.getElementById('save-schedule-form');
const saveScheduleMessage = document.getElementById('save-schedule-message');

function getCurrentScheduleData() {
    // Get current timetable data
    const schedule = {
        addedSections: { ...addedSections },
        college: document.getElementById('college-dropdown').value,
        major: document.getElementById('major-dropdown').value,
        timestamp: new Date().toISOString()
    };
    
    return schedule;
}

function saveCurrentSchedule(scheduleName) {
    if (!currentUser) {
        openModal('auth-modal');
        switchTab('login');
        return { success: false, message: 'Please log in to save schedules' };
    }
    
    // Get current schedule
    const schedule = getCurrentScheduleData();
    schedule.name = scheduleName;
    schedule.id = Date.now().toString();
    
    // Find user in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) {
        return { success: false, message: 'User not found' };
    }
    
    // Add schedule to user's saved schedules
    if (!users[userIndex].savedSchedules) {
        users[userIndex].savedSchedules = [];
    }
    
    users[userIndex].savedSchedules.push(schedule);
    
    // Update current user and save to storage
    currentUser = users[userIndex];
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    saveUsers();
    loadSavedSchedules();
    return { success: true, message: 'Schedule saved successfully!' };
}

function loadSavedSchedules() {
    const savedSchedulesPanel = document.getElementById('saved-schedules-panel');
    savedSchedulesPanel.innerHTML = '';
    
    if (!currentUser || !currentUser.savedSchedules || currentUser.savedSchedules.length === 0) {
        savedSchedulesPanel.innerHTML = '<p>You have no saved schedules yet.</p>';
        return;
    }
    
    currentUser.savedSchedules.forEach(schedule => {
        const card = document.createElement('div');
        card.className = 'saved-schedule-card';
        
        const courseCount = Object.keys(schedule.addedSections).length;
        
        card.innerHTML = `
            <h4>${schedule.name}</h4>
            <p>${schedule.college} - ${schedule.major}</p>
            <p>Courses: ${courseCount}</p>
            <div class="saved-schedule-actions">
                <button class="load-schedule-btn" data-id="${schedule.id}">Load</button>
                <button class="delete-schedule-btn" data-id="${schedule.id}">Delete</button>
            </div>
        `;
        
        savedSchedulesPanel.appendChild(card);
    });
    
    // Add event listeners for load/delete buttons
    document.querySelectorAll('.load-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            loadSchedule(this.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteSchedule(this.dataset.id);
        });
    });
}

function loadSchedule(scheduleId) {
    if (!currentUser || !currentUser.savedSchedules) return;
    
    const schedule = currentUser.savedSchedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    // First clear current timetable
    Object.keys(addedSections).forEach(courseCode => {
        removeCourseFromTimetable(courseCode);
    });
    
    // Set college and major
    document.getElementById('college-dropdown').value = schedule.college;

    const collegeChangeEvent = new Event('change');
    document.getElementById('college-dropdown').dispatchEvent(collegeChangeEvent);
    
    setTimeout(() => {
        document.getElementById('major-dropdown').value = schedule.major;
        const majorChangeEvent = new Event('change');
        document.getElementById('major-dropdown').dispatchEvent(majorChangeEvent);
        
        // add courses
        setTimeout(() => {
            Object.keys(schedule.addedSections).forEach(courseCode => {
                const course = courseData.find(c => c.courseCode === courseCode);
                if (course) {
                    // Add sections that were in the saved schedule
                    const savedSections = schedule.addedSections[courseCode];
                    
                    const sectionsToAdd = course.sections.filter(section => 
                        savedSections.some(saved => saved.Section === section.Section)
                    );
                    
                    const modifiedCourse = {
                        ...course,
                        sections: sectionsToAdd
                    };
                    
                    // Add to timetable
                    addCourseToTimetable(modifiedCourse);
                }
            });
        }, 300);
    }, 100);
    
    alert(`Schedule "${schedule.name}" loaded successfully!`);
}

function deleteSchedule(scheduleId) {
    if (!currentUser || !currentUser.savedSchedules) return;
    
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    // Find user in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex === -1) return;
    
    // Remove schedule from user's saved schedules
    users[userIndex].savedSchedules = users[userIndex].savedSchedules.filter(
        s => s.id !== scheduleId
    );
    
    // Update current user and save to storage
    currentUser = users[userIndex];
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    saveUsers();
    
    // Reload saved schedules in UI
    loadSavedSchedules();
    
    alert('Schedule deleted successfully!');
}

/////////////
/// DOM 
/////////////
  document.addEventListener('DOMContentLoaded', function() {
    // Create floating card container
    const floatingCard = document.createElement('div');
    floatingCard.id = 'floating-course-details';
    floatingCard.classList.add('floating-card');
    document.body.appendChild(floatingCard);
  
    generateTimetable();
  
    // Load course data
    fetch('Summer 2025 Course Offering.json')
        .then(response => response.json())
        .then(data => {
            courseData = data;
            // Initialize with General Education courses
            populateCourses(courseData, '');
        })
        .catch(console.error);
  
    // College dropdown
    document.getElementById('college-dropdown').addEventListener('change', function() {
      const college = this.value;
      const majorDropdown = document.getElementById('major-dropdown');
      
      majorDropdown.innerHTML = '<option value="">Choose a Major</option>';
      if (college && collegeMajors[college]) {
          collegeMajors[college].forEach(major => {
              majorDropdown.appendChild(new Option(major, major));
          });
      }
      
      // Update the requirements title if college is selected
      const titleElement = document.querySelector('.category-group:nth-child(2) .category-title');
      if (college) {
          titleElement.textContent = `${college} Requirements`;
      } else {
          titleElement.textContent = "Please Select a College";
      }
      
      // Repopulate courses with the current major selection
      populateCourses(courseData, majorDropdown.value);
    });
  
    // Major dropdown 
    document.getElementById('major-dropdown').addEventListener('change', function() {
        const selectedMajor = this.value;
        populateCourses(courseData, selectedMajor);
    });
  
    // Category toggles
    document.querySelectorAll('.category-title').forEach(title => {
        title.addEventListener('click', function(e) {
            e.preventDefault(); 
            this.classList.toggle('active');
            this.nextElementSibling.classList.toggle('active');
        });
    });
  
    // Add/remove course buttons
    document.querySelector('.course-selection').addEventListener('click', function(e) {
        const button = e.target.closest('.add-button');
        if (button) {
            const courseItem = button.closest('.course-item');
            const courseTitle = courseItem.querySelector('.course-title').textContent;
            const codeMatch = courseTitle.match(/^[A-Z]+\d+/);
            
            if (codeMatch) {
                const courseCode = codeMatch[0];
                const course = courseData.find(c => c.courseCode === courseCode);
                
                if (course) {
                    if (button.classList.contains('added')) {
                        // Remove course
                        removeCourseFromTimetable(course.courseCode);
                        button.classList.remove('added');
                    } else {
                        // Add course
                        addCourseToTimetable(course);
                        button.classList.add('added');
                    }
                }
            }
        }
    }); 
    // Check for logged in user when page loads
    checkLoggedInUser();
    
    loginBtn.addEventListener('click', function() {
        openModal('auth-modal');
        switchTab('login');
    });
    
    signupBtn.addEventListener('click', function() {
        openModal('auth-modal');
        switchTab('signup');
    });
    
    logoutBtn.addEventListener('click', logoutUser);
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Close modals when clicking outside content
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginMessage = document.getElementById('login-message');
        
        const result = loginUser(email, password);
        
        if (result.success) {
            loginMessage.textContent = 'Login successful!';
            loginMessage.style.color = '#4CAF50';
            
            setTimeout(() => {
                closeModal('auth-modal');
                updateAuthUI();
            }, 1000);
        } else {
            loginMessage.textContent = result.message;
            loginMessage.style.color = '#f44336';
        }
    });
    
    // Signup form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm').value;
        const signupMessage = document.getElementById('signup-message');
        
        // Password validation
        if (password !== confirmPassword) {
            signupMessage.textContent = 'Passwords do not match';
            return;
        }
        
        const result = createUser(username, email, password);
        
        if (result.success) {
            signupMessage.textContent = 'Account created successfully!';
            signupMessage.style.color = '#4CAF50';
            loginUser(email, password);
            
            setTimeout(() => {
                closeModal('auth-modal');
                updateAuthUI();
            }, 1000);
        } else {
            signupMessage.textContent = result.message;
            signupMessage.style.color = '#f44336';
        }
    });
    
    // Save schedule button
    saveScheduleBtn.addEventListener('click', function() {
        if (!currentUser) {
            openModal('auth-modal');
            switchTab('login');
            return;
        }
        
        // Check if there are courses added to the timetable
        if (Object.keys(addedSections).length === 0) {
            alert('Please add courses to your schedule before saving.');
            return;
        }
        
        openModal('save-schedule-modal');
    });
    
    // Save schedule form submission
    saveScheduleForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const scheduleName = document.getElementById('schedule-name').value;
        const result = saveCurrentSchedule(scheduleName);
        
        if (result.success) {
            saveScheduleMessage.textContent = result.message;
            saveScheduleMessage.style.color = '#4CAF50';
            
            // Reset form and close modal after short delay
            setTimeout(() => {
                document.getElementById('schedule-name').value = '';
                closeModal('save-schedule-modal');
            }, 1500);
        } else {
            saveScheduleMessage.textContent = result.message;
            saveScheduleMessage.style.color = '#f44336';
        }
    });   
});