// ======================
// GLOBAL VARIABLES
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
  // TIMETABLE FUNCTIONS
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
  
  
  // ======================
  // COURSE MANAGEMENT
  // ======================
  // In the addCourseToTimetable function, modify how course elements are created
  function addCourseToTimetable(course) {
    course.sections.forEach(section => {
        const [startTime, endTime] = section.Time.split('-');
        const durationMinutes = (new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / 60000;
        const height = `${(durationMinutes / 10) * 20}px`;

        section.Days.split('').forEach(day => {
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

            // Create course element
            const courseElement = document.createElement('div');
            courseElement.className = 'course-cell stacked';
            courseElement.style.height = '100%';
            
            // Add the course-content class here
            courseElement.innerHTML = `<div class="course-content">${section.Section}: ${course.courseTitle}</div>`;
            courseElement.dataset.courseId = course.courseCode;
            courseElement.dataset.section = section.Section;

            // Add to stack container
            stackContainer.appendChild(courseElement);
            
            // Update the width of all elements in the stack
            updateStackLayout(stackContainer);
            
            // Use courseElement instead of e.target
            courseElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showCourseDetails(course, section, courseElement);
            });
        });

        if (!addedSections[course.courseCode]) {
            addedSections[course.courseCode] = [];
        }
        addedSections[course.courseCode].push(section);
    });
    updateAddButtonState(course.courseCode);
}
  
  function updateStackLayout(stackContainer) {
    const courseElements = stackContainer.querySelectorAll('.course-cell');
    const count = courseElements.length;
    
    if (count > 1) {
        // Set each course to take up equal width
        const width = 100 / count;
        courseElements.forEach((el, index) => {
            el.style.width = `${width}%`;
            el.style.left = `${index * width}%`;
            el.classList.add('stacked');
        });
    } else if (count === 1) {
        // Only one course, it should take full width
        courseElements[0].style.width = '100%';
        courseElements[0].style.left = '0';
        courseElements[0].classList.remove('stacked');
    }
  }
  
  function removeCourseFromTimetable(courseId) {
    // Remove all instances of this course from timetable
    document.querySelectorAll(`[data-course-id="${courseId}"]`).forEach(el => {
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
            
            // Use a div for the content to enable text wrapping
            // Add the course-content class here
            courseElement.innerHTML = `<div class="course-content">${sectionToRestore.Section}: ${course.courseTitle}</div>`;
            courseElement.dataset.courseId = course.courseCode;
            courseElement.dataset.section = sectionToRestore.Section;
  
            // Add to stack container
            stackContainer.appendChild(courseElement);
            
            // Update the width of all elements in the stack
            updateStackLayout(stackContainer);
            
            // Use courseElement instead of e.target
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
  // COURSE DISPLAY
  // ======================
  function populateCourses(data, selectedMajor) {
      const collegeDropdown = document.getElementById('college-dropdown');
      const selectedCollege = collegeDropdown.value;
      
      // Save current expand/collapse state
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
  
      // Update each category in the UI
      document.querySelectorAll('.category-group').forEach(group => {
          const titleElement = group.querySelector('.category-title');
          const contentDiv = group.querySelector('.category-content');
          const title = titleElement.textContent;
          
          // Clear existing content
          contentDiv.innerHTML = '';
          
          // Get courses for this category
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
              // Show major-specific categories if major is selected
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
              
              // Restore previous expand/collapse state if available
              if (categoryStates[title] !== undefined) {
                  titleElement.classList.toggle('active', categoryStates[title]);
                  contentDiv.classList.toggle('active', categoryStates[title]);
              }
          } else {
              // No courses to display, collapse the category
              titleElement.classList.remove('active');
              contentDiv.classList.remove('active');
          }
      });
      
      // Update add button states
      Object.keys(addedSections).forEach(courseCode => {
          updateAddButtonState(courseCode);
      });
  }
  
  // ======================
  // COURSE DETAILS
  // ======================
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
  
    // Preserve all existing functionality
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
  
  // ======================
  // UTILITY FUNCTIONS
  // ======================
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
  // INITIALIZATION
  // ======================
  document.addEventListener('DOMContentLoaded', function() {
    // Create floating card container
    const floatingCard = document.createElement('div');
    floatingCard.id = 'floating-course-details';
    floatingCard.classList.add('floating-card');
    document.body.appendChild(floatingCard);
  
    // Initialize timetable
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
  
    // College dropdown handler
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
  
    // Major dropdown handler
    document.getElementById('major-dropdown').addEventListener('change', function() {
        const selectedMajor = this.value;
        populateCourses(courseData, selectedMajor);
    });
  
    // Category toggles - manually handle expand/collapse
    document.querySelectorAll('.category-title').forEach(title => {
        title.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
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
  });