# Plaggy
## A complete system for AI use prevention and detection in programming assignments.

# Overview
Plaggy is a tool for instructors to prevent and detect AI misuse in assignments without being invasive for students and respecting their privacy.

Students install the Plaggy agent and then gain access to commands to track and upload their assignments. 
Instructors have a portal from where they can create new assignments and view the uploads of students.

Before students start programming for their assignment they run `plaggy watch <assingment-dir>` to start tracking their assignment.
This notifies the Plaggy daemon of the addition of this folder and file system notifications for the file start to be tracked. 
In this directory when the students saves a file, the Plaggy daemon creates a diff of the last edit to the file and saves it to a local sqlite database. 
After completing their assignemnt the student runs `plaggy submit` and submits their assignment.

The instructor can then view this submission from their portal. 
The instructor is also notified of suspicious activity in the assignment.
For example if an edit was done with inhuman speed, it could signal a large copy-paste, or if no deletions were made to the file, it could mean assignment code was directly copy-pasted instead of being written from scratch. These things are caught by the system and flagged for the instructor to view.
The instructor can also see the whole diff history of a file similar to a git commit log. This allows them to make more informed decisions on the AI usage of students while flags show them where to look first.

# History
Plaggy was first created for the Amazon Mentorship Program at Bilkent University where it won the Best Technical Solution award.
The demo video submitted for the project can be viewed here: <https://drive.google.com/file/d/1seTZonq7x2dnjLiXrEp2CcQo1wb9jm7E/view?usp=sharing>

