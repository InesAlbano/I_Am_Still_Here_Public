drop database if exists iamstillhere_db;
create database iamstillhere_db;
use iamstillhere_db;

drop table if exists StudentsManuallyRemoved cascade;
drop table if exists Evaluation cascade ;
drop table if exists AttendanceHistory cascade ;
drop table if exists Code cascade ;
drop table if exists FingerprintData cascade ;
drop table if exists CodeAttendance cascade ;
drop table if exists Attendance cascade ;
drop table if exists Class cascade ;
drop table if exists ProfessorTeachesCourse cascade ;
drop table if exists Professor cascade ;
drop table if exists Shift cascade ;
drop table if exists StudentsEnrolled cascade ;
drop table if exists Course cascade ;
drop table if exists PCM2021 cascade ;
drop table if exists User cascade ;
drop table if exists StudentStatus cascade ;
drop table if exists IndicatorFixedWeight cascade;
drop table if exists ConfidenceWeight cascade;
drop table if exists Threshold cascade;

CREATE TABLE User (
	ist_id						varchar(255),
	access_token 				varchar(255),
	refresh_token 				varchar(255),
	iamhere_token				varchar(255),
	name						varchar(255),
	role						varchar(255),
	creation					timestamp,
    short_name                  varchar(255),
    std_number                  int,
	PRIMARY KEY(ist_id)
);

CREATE TABLE Professor (
	ist_id						varchar(255),
    PRIMARY KEY(ist_id),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id)
);

CREATE TABLE Course (
	courseID					varchar(255),
	courseName					varchar(255),
	academicTerm				varchar(255),
	in_use                      tinyint,
	fenix_id                    varchar(255),
	last_updated                date,
	secret                      varchar(255),
	codetype                    varchar(255) DEFAULT 'LN',
    codelength                  int DEFAULT 6,
    time                        int DEFAULT 10,
    consecutive                 int default 3,
	PRIMARY KEY(courseID)
);

CREATE TABLE Shift (
    shift_id					varchar(255),
    courseID					varchar(255),
    fenix_id    				varchar(255),
    type        				varchar(255),
    week_day                    tinyint,
    start                       time,
    end                         time,
    campus                      varchar(255),
    room                        varchar(255),
    secret                      varchar(255),
    prof_id                     varchar(255),
    codetype                    varchar(255) DEFAULT 'LN',
    codelength                  int DEFAULT 6,
    time                        int DEFAULT 10,
    consecutive                 int default 3,
    PRIMARY KEY(shift_id)
);

CREATE TABLE ProfessorTeachesCourse (
	ist_id 						varchar(255),
	courseID					varchar(255),
	in_use                      tinyint,
	PRIMARY KEY(ist_id, courseID),
	FOREIGN KEY(ist_id) REFERENCES Professor (ist_id),
	FOREIGN KEY(courseID) REFERENCES Course (courseID)
);

CREATE TABLE Class (
	ist_id							varchar(255),
	courseID						varchar(255),
	classID							varchar(255),
	n_checks                        int(1),
	PRIMARY KEY(classID),
	FOREIGN KEY(ist_id) REFERENCES Professor (ist_id),
	FOREIGN KEY(courseID) REFERENCES Course(courseID)
);

CREATE TABLE Attendance (
	ist_id							varchar(255),
	attendanceID					int AUTO_INCREMENT,
    number                          int,
    numberAttendance                int DEFAULT 1,
	courseID                        varchar(255),
	title                           varchar(255),
	is_extra                        tinyint,
	randomID						int,
	code_type						varchar(255),
	code_length						int,
	total_time_s					int,
	consecutive_codes				int,
    date							varchar(255),
	open							boolean,
	shift_id                        varchar(255),
	requiresAccess                  tinyint,
	secret                          varchar(255),
	attendance_checks               int(1),
	remote                          boolean DEFAULT false,
    removed                         int(1) DEFAULT 0,
    PRIMARY KEY(attendanceID),
    FOREIGN KEY(ist_id) REFERENCES Professor(ist_id)
);

CREATE TABLE CodeAttendance (
	server_code						VARCHAR(255),
	attendanceID					int,
	sequence						int,

	PRIMARY KEY(attendanceID, sequence),
	FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID)
);

CREATE TABLE FingerprintData (
	fingerprintID				    int AUTO_INCREMENT,
	timestamp				        timestamp,
    attendanceID			        int,
	ist_id						    varchar(255),
    useragent				        varchar(255),
    ip		                        varchar(255),
    languages                        varchar(255),
    colorDepth                      varchar(255),
    deviceMemory                    varchar(255),
    hardwareConcurrency             varchar(255),
    screenResolution                varchar(255),
    availableScreenResolution       varchar(255),
    timezoneOffset                  varchar(255),
    sessionStorage                  varchar(255),
    localStorage                    varchar(255),
    platform                        varchar(255),
    plugins                         text,
    canvas                          varchar(255),
    pixelDepth                      varchar(255),
    adBlock                         varchar(255),
    fonts                           varchar(255),
    audio                           varchar(255),
    gpu                             varchar(255),
    accuracyLat1				    varchar(255),
    accuracyLat2		            varchar(255),
    accuracyLat3                    varchar(255),
    accuracyLat4                    varchar(255),
    accuracyLat5                    varchar(255),
    accuracyLong1                   varchar(255),
    accuracyLong2                   varchar(255),
    accuracyLong3                   varchar(255),
    accuracyLong4                   varchar(255),
    accuracyLong5                   varchar(255),
    accur                           varchar(255),
	PRIMARY KEY(fingerprintID),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id),
    FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID)
);

CREATE TABLE FingerprintConfidence (
     fingerprintID				     int AUTO_INCREMENT,
     attendanceID			         int,
     ist_id						     varchar(255),
     useragent				         double,
     ip		                         double,
     languages                       double,
     colorDepth                      double,
     deviceMemory                    double,
     hardwareConcurrency             double,
     screenResolution                double,
     availableScreenResolution       double,
     sessionStorage                  double,
     localStorage                    double,
     platform                        double,
     plugins                         double,
     fonts                           double,
     audio                           double,
     gpu                             double,
     PRIMARY KEY(fingerprintID),
     FOREIGN KEY(ist_id) REFERENCES User(ist_id),
     FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID)
);

CREATE TABLE AcademicTerms (
    academicTermID                  int AUTO_INCREMENT,
    academicTerm                    varchar(255),
    PRIMARY KEY(academicTermID)
);


CREATE TABLE FingerprintHistory (
    ist_id                           varchar(255),
    indicator_id                     varchar(255),
    indicator_value                  text,
    indicator_weight                 double,
	PRIMARY KEY(ist_id, indicator_id),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id)
);


CREATE TABLE Code (
    codeID					        int AUTO_INCREMENT,
	date_input				        timestamp,
	ist_id 					        varchar(255),
	attendanceID 			        int,
	correct 				        boolean,
	sequence				        int,
	code_input 				        varchar(255),
	time_taken_s 			        int,
	PRIMARY KEY(codeID),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id),
	FOREIGN KEY(attendanceID, sequence) REFERENCES CodeAttendance(attendanceID, sequence)
);

CREATE TABLE AttendanceHistory (
    attendancehistoryID			    int auto_INCREMENT,
    attendanceID					int,
    ist_id						    varchar(255),
	success						    boolean,
    manually						boolean,
    late                            tinyint, -- 1 late, 2 left early, 3 middle -- -1/NULL OK
    correct                         boolean,
    confidence                      int, -- 0 flag, 1 maybe, 2 good --
    PRIMARY KEY(attendancehistoryID),
	FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID),
    FOREIGN KEY(ist_id) REFERENCES User(ist_id)
);


CREATE TABLE Evaluation (
	evaluation_id			    int AUTO_INCREMENT,
	ist_id 					    varchar(255),
	attendanceID 			    int,
	nr_clicks				    int,
	session_time_s			    int,

	PRIMARY KEY(evaluation_id),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id),
	FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID)
);

create table StudentsManuallyRemoved (
	removedID				    int AUTO_INCREMENT,
	ist_id						varchar(255),
	attendanceID			    int,
	PRIMARY KEY(removedID),
	FOREIGN KEY(ist_id) REFERENCES User(ist_id),
	FOREIGN KEY(attendanceID) REFERENCES Attendance(attendanceID)
);

create table StudentsEnrolled (
     ist_id						varchar(255),
     courseID   			    varchar(255),
     PRIMARY KEY(ist_id, courseID),
     FOREIGN KEY(courseID) REFERENCES Course(courseID)
);

create table PCM2021 (
      pcm2021_id                int,
      ist_id					varchar(255),
      std_number   			    int,
      name         			    varchar(255),
      PRIMARY KEY(pcm2021_id),
      FOREIGN KEY(ist_id) REFERENCES User(ist_id)
);

CREATE TABLE StudentStatus (
       courseID    varchar(255),
       shiftID     varchar(255),
       classNumber int,
       totalComplete   int,
       specificComplete    varchar(255),
       specificLate        varchar(255),
       specificEarly       varchar(255),
       PRIMARY KEY(courseID, shiftID, classNumber)
);

CREATE TABLE IndicatorFixedWeight (
      courseID    varchar(255),
      shiftID     varchar(255),
      classNumber int,
      useragent int DEFAULT  2,
      ip int DEFAULT  3,
      languages int DEFAULT  1,
      colorDepth int DEFAULT  4,
      deviceMemory int DEFAULT  3,
      hardwareConcurrency int DEFAULT  3,
      screenResolution int DEFAULT  4,
      availableScreenResolution int DEFAULT  3,
      sessionStorage int DEFAULT  1,
      localStorage int DEFAULT  1,
      platform int DEFAULT  3,
      plugins int DEFAULT  3,
      fonts int DEFAULT  3,
      audio int DEFAULT  4,
      gpu int DEFAULT  4,
      adBlock int DEFAULT  4,
      pixelDepth int DEFAULT  4,
      future boolean DEFAULT false,
      PRIMARY KEY(courseID, shiftID, classNumber)
);

CREATE TABLE ConfidenceWeight (
      courseID    varchar(255),
      shiftID     varchar(255),
      classNumber int,
      fp_percentage int DEFAULT 50,
      gps_percentage int DEFAULT  50,
      future        boolean DEFAULT false,
      PRIMARY KEY(courseID, shiftID, classNumber)
);

CREATE TABLE Threshold (
      courseID    varchar(255),
      shiftID     varchar(255),
      classNumber int,
      failed int DEFAULT 81,
      ok int DEFAULT  90,
      PRIMARY KEY(courseID, shiftID, classNumber)
);

# PROCEDURES
DELIMITER //
DROP PROCEDURE IF EXISTS `updateFingerprintData`;
CREATE PROCEDURE `updateFingerprintData`(my_attendanceID int, my_languages varchar(255), my_colorDepth varchar(255), my_deviceMemory varchar(255), my_hardwareConcurrency varchar(255), my_screenResolution varchar(255),my_availableScreenResolution varchar(255), my_timezoneOffset varchar(255), my_sessionStorage varchar(255), my_localStorage varchar(255), my_platform varchar(255), my_plugins text, my_pixelDepth varchar(255), my_adBlock varchar(255), my_fonts varchar(255), my_audio varchar(255), my_gpu varchar(255), my_accurLat1 varchar(255), my_accurLat2 varchar(255), my_accurLat3 varchar(255), my_accurLat4 varchar(255), my_accurLat5 varchar(255), my_accurLong1 varchar(255), my_accurLong2 varchar(255), my_accurLong3 varchar(255), my_accurLong4 varchar(255), my_accurLong5 varchar(255), my_accur varchar(255), my_ist_id varchar(255))
BEGIN
    UPDATE FingerprintData SET
                               languages = my_languages,
                               colorDepth = my_colorDepth,
                               deviceMemory = my_deviceMemory,
                               hardwareConcurrency = my_hardwareConcurrency,
                               screenResolution = my_screenResolution,
                               availableScreenResolution = my_availableScreenResolution,
                               timezoneOffset = my_timezoneOffset,
                               sessionStorage = my_sessionStorage,
                               localStorage = my_localStorage,
                               platform = my_platform,
                               plugins = my_plugins,
                               pixelDepth = my_pixelDepth,
                               adBlock = my_adBlock,
                               fonts = my_fonts,
                               audio = my_audio,
                               gpu = my_gpu,
                               accuracyLat1 = my_accurLat1,
                               accuracyLat2 = my_accurLat2,
                               accuracyLat3 = my_accurLat3,
                               accuracyLat4 = my_accurLat4,
                               accuracyLat5 = my_accurLat5,
                               accuracyLong1 = my_accurLong1,
                               accuracyLong2 = my_accurLong2,
                               accuracyLong3 = my_accurLong3,
                               accuracyLong4 = my_accurLong4,
                               accuracyLong5 = my_accurLong5,
                               accur = my_accur

    WHERE attendanceID = my_attendanceID and ist_id = my_ist_id;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `ShowAttendances`;
CREATE PROCEDURE `ShowAttendances`()
BEGIN
    select distinct (a.ist_id), ah.attendanceID, pcm.std_number, pcm.name, ah.late, ah.manually, a.number, a.is_extra, a.title
    from Attendance a
             join AttendanceHistory ah
                  on ah.attendanceID = a.attendanceID
             join PCM2021 pcm
                  on ah.ist_id = pcm.ist_id
    where (a.ist_id = 'ist13909' or a.ist_id = 'ist13898' or a.ist_id = 'ist168202')
      and a.courseID = 'PCM26'
      and a.attendanceID > 107;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `setLate`;
CREATE PROCEDURE `setLate`(my_attendanceID int, my_ist_id varchar(255), isLate boolean)
BEGIN
    UPDATE AttendanceHistory SET late = isLate WHERE (attendanceID = my_attendanceID and ist_id = my_ist_id);
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `SetCourseToInUse`;
CREATE PROCEDURE `SetCourseToInUse`(my_ist_id varchar(255), my_courseID varchar(255))
BEGIN
    UPDATE ProfessorTeachesCourse SET in_use = 1 where courseID = my_courseID and ist_id = my_ist_id;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `RemoveStudentFromAttendance`;
CREATE PROCEDURE `RemoveStudentFromAttendance`(my_ist_id varchar(255), my_attendanceID int)
BEGIN
    INSERT INTO StudentsManuallyRemoved(ist_id, attendanceID)
    VALUES(my_ist_id, my_attendanceID);

    DELETE FROM AttendanceHistory WHERE attendanceID =  my_attendanceID and ist_id = my_ist_id;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `RemoveAttendanceFromProfessor`;
CREATE PROCEDURE `RemoveAttendanceFromProfessor`(my_classNumber int, my_courseID varchar(255), my_shift_id varchar(255), my_ist_id varchar(255))
BEGIN
    UPDATE Attendance SET removed = 1 WHERE ist_id = my_ist_id and courseID = my_courseID and shift_id = my_shift_id and number = my_classNumber;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertStudentToAttendance`;
CREATE PROCEDURE `InsertStudentToAttendance`(my_ist_id varchar(255), my_attendanceID int)
BEGIN
    DECLARE existsInTable VARCHAR(255);

    INSERT IGNORE INTO User (ist_id)
    VALUES (my_ist_id);

    SELECT ist_id INTO existsInTable FROM AttendanceHistory WHERE ist_id = my_ist_id AND attendanceID = my_attendanceID LIMIT 1;
    IF existsInTable IS NULL THEN
        INSERT IGNORE INTO AttendanceHistory (attendanceID, ist_id, success, manually)
        VALUES(my_attendanceID, my_ist_id, true, true);
    END IF;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `GetClassAttendances`;
CREATE PROCEDURE `GetClassAttendances`(my_secret varchar(255))
BEGIN
    select distinct a.ist_id, u.ist_id as std_number, u.name, ah.late, ah.manually, a.number, a.is_extra, a.shift_id
        from Attendance a
                 join AttendanceHistory ah
                      on ah.attendanceID = a.attendanceID
                 join User u
                      on ah.ist_id = u.ist_id
                          and a.secret = my_secret
                          and (ah.late = -1 or ah.late  is Null)
        order by a.attendanceID;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `GetAttendances`;
CREATE PROCEDURE `GetAttendances`(my_secret varchar(255))
BEGIN
    select distinct  a.ist_id, u.ist_id as std_number, u.name, ah.late, ah.manually, a.number, a.is_extra, a.shift_id
        from Attendance a
                 join AttendanceHistory ah
                      on ah.attendanceID = a.attendanceID
                 join User u
                      on ah.ist_id = u.ist_id
                 join Course c
                      on c.courseID = a.courseID
                          and c.secret = my_secret
                          and (ah.late = -1 or ah.late  is Null)
        order by a.attendanceID;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `GetFingerprintInfo`;
CREATE PROCEDURE `GetFingerprintInfo`(my_ist_id varchar(255), my_attendanceID int)
BEGIN
    SELECT distinct f.ip, f.useragent
    FROM FingerprintData f
    WHERE f.ist_id = my_ist_id AND
            f.attendanceID = my_attendanceID;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `getNextClassNumber`;
CREATE PROCEDURE `getNextClassNumber`(my_courseID varchar(255), my_ist_id varchar(255))
BEGIN
    DECLARE count_nr INTEGER;

    SELECT number INTO count_nr FROM Attendance a, AttendanceHistory ah
    WHERE a.ist_id = my_ist_id and a.attendanceID = ah.attendanceID AND a.courseID = my_courseID AND a.is_extra != 1 AND a.removed=0
    group by a.attendanceID order by a.attendanceID DESC limit 1;
    IF count_nr is null THEN
        SET count_nr = 1;
    ELSE
        SET count_nr = count_nr + 1;
    END IF;

    SELECT count_nr;

END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `GetNumberCodesGenerated`;
CREATE PROCEDURE `GetNumberCodesGenerated`(my_courseID varchar(255), my_ist_id varchar(255))
BEGIN
    select a.attendanceID, a.number, count(distinct ca.server_code) as nr_code
    from Code c
             join Attendance a
                  on a.attendanceID = c.attendanceID
             join CodeAttendance ca
                  on ca.attendanceID = c.attendanceID
    where a.ist_id = my_ist_id and a.courseID = my_courseID
      AND a.removed=0
    group by c.attendanceID;
END
//
DELIMITER ;

DELIMITER //

DROP PROCEDURE IF EXISTS `GetAttendanceInformation`;
CREATE PROCEDURE `GetAttendanceInformation`(my_courseID varchar(255), my_ist_id varchar(255), my_attendanceID int, my_shift varchar(255))
BEGIN
    select a.ist_id, u.ist_id as fenix_number, u.name, u.short_name, u.std_number as std_number, ah.late, ah.manually, a.number, a.is_extra
    from Attendance a
             join AttendanceHistory ah
                  on ah.attendanceID = a.attendanceID
             join User u
                  on ah.ist_id = u.ist_id
    where a.ist_id = my_ist_id
      and a.courseID = my_courseID
      and a.attendanceID = my_attendanceID
      and a.shift_id = my_shift;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `GetShiftAttendances`;
CREATE PROCEDURE `GetShiftAttendances`(my_secret varchar(255))
BEGIN
    select distinct a.ist_id, u.ist_id as std_number, u.name, ah.late, ah.manually, a.number, a.is_extra, a.shift_id
        from Attendance a
                 join AttendanceHistory ah
                      on ah.attendanceID = a.attendanceID
                 join User u
                      on ah.ist_id = u.ist_id
                 join Course c
                      on c.courseID = a.courseID
                 join Shift s
                      on s.courseID = c.courseID
                          and s.secret = my_secret
                          and (ah.late = -1 or ah.late  is Null)
        order by a.attendanceID;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertShiftInfor`;
CREATE PROCEDURE `InsertShiftInfor`(my_shift_id varchar(255), my_courseID varchar(255), my_fenix_id varchar(255), my_type varchar(255), my_week_day varchar(255), my_start time, my_end time)
BEGIN
    INSERT IGNORE INTO Shift(shift_id, courseID, fenix_id, type, week_day, start, end)
    VALUES (my_shift_id, my_courseID, my_fenix_id, my_type, my_week_day, my_start, my_end);
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertProfessorToSystem`;
CREATE PROCEDURE `InsertProfessorToSystem`(my_ist_id varchar(255), my_courseID varchar(255))
BEGIN
    INSERT IGNORE INTO Professor (ist_id)
    VALUES (my_ist_id);

    INSERT IGNORE INTO ProfessorTeachesCourse (ist_id, courseID, in_use)
    VALUES(my_ist_id, my_courseID, 1);

    SELECT ist_id, name FROM User WHERE ist_id = my_ist_id;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertStudentEnrolled`;
CREATE PROCEDURE `InsertStudentEnrolled`(my_ist_id varchar(255), my_courseID varchar(255))
BEGIN
    INSERT IGNORE INTO StudentsEnrolled(ist_id, courseID)
    VALUES(my_ist_id, my_courseID);
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `insertStudentInHistory`;
CREATE PROCEDURE `insertStudentInHistory`(my_attendanceID1 int, my_ist_id1 varchar(255))
BEGIN
    INSERT INTO AttendanceHistory(attendanceID, ist_id, correct) VALUES (my_attendanceID1, my_ist_id1, true);
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertStudent`;
CREATE PROCEDURE `InsertStudent`(my_short_name varchar(255), my_std_number varchar(255), my_ist_id varchar(255), my_courseID varchar(255))
BEGIN

    UPDATE User SET short_name = my_short_name, std_number = my_std_number WHERE ist_id = my_ist_id;

    INSERT IGNORE INTO StudentsEnrolled(ist_id, courseID) VALUES (my_ist_id,my_courseID);

END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertProfessorandCourse`;
CREATE PROCEDURE `InsertProfessorandCourse`(ist_id varchar(255), courseID varchar(255), courseName varchar(255), academicTerm varchar(255), fenix_id varchar(255), date date, secret varchar(255))
BEGIN
    INSERT IGNORE INTO Professor (ist_id)
    VALUES (ist_id);

    INSERT IGNORE INTO Course (courseID, courseName, academicTerm, fenix_id, last_updated, secret)
    VALUES(courseID, courseName, academicTerm, fenix_id, date, secret);

    INSERT IGNORE INTO ProfessorTeachesCourse (ist_id, courseID)
    VALUES(ist_id, courseID);
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertLateStudentToAttendance`;
CREATE PROCEDURE `InsertLateStudentToAttendance`(my_ist_id varchar(255), my_attendanceID int)
BEGIN
    DECLARE existsInTable VARCHAR(255);

    INSERT IGNORE INTO User (ist_id)
    VALUES (my_ist_id);

    SELECT ist_id INTO existsInTable FROM AttendanceHistory WHERE ist_id = my_ist_id AND attendanceID = my_attendanceID LIMIT 1;
    IF existsInTable IS NULL THEN
        INSERT IGNORE INTO AttendanceHistory (attendanceID, ist_id, success, late)
        VALUES(my_attendanceID, my_ist_id, true, true);
    END IF;
END
//
DELIMITER ;
DELIMITER //

DROP PROCEDURE IF EXISTS `InsertFingerprint`;
CREATE PROCEDURE `InsertFingerprint`(my_attendanceID int, my_ist_id varchar(255), my_ip varchar (255), my_usergante varchar(255))
BEGIN
    DECLARE existsInTable VARCHAR(255);
    SELECT ist_id INTO existsInTable from FingerprintData where attendanceID = my_attendanceID and ist_id = my_ist_id LIMIT 1;
    IF existsInTable IS NULL THEN
        INSERT INTO FingerprintData(ist_id, useragent, ip, attendanceID) VALUES(my_ist_id,my_usergante,my_ip,my_attendanceID);
    END IF;
END
//
DELIMITER ;

DELIMITER //

DROP PROCEDURE IF EXISTS `AttendanceMapping`;
CREATE PROCEDURE `AttendanceMapping`(ist_id varchar(255), randomID int, code_type varchar(255), code_length int, total_time_s int, consecutive_codes int, date varchar(255), open boolean, my_courseID varchar(255), my_is_extra varchar(255), my_title varchar(255), my_number int, my_shift varchar(255), my_access boolean, my_secret varchar(255), my_attendance_checks int(1), attendance_number int(1), my_remote boolean)
BEGIN

    INSERT INTO Attendance(ist_id, randomID, code_type, code_length, total_time_s, consecutive_codes, date, open, number, courseID, is_extra, title, shift_id, requiresAccess, secret, attendance_checks, numberAttendance, remote)
    VALUES(ist_id, randomID, code_type, code_length, total_time_s, consecutive_codes, date, open, my_number, my_courseID, my_is_extra, my_title, my_shift, my_access, my_secret, my_attendance_checks, attendance_number, my_remote);

    SELECT LAST_INSERT_ID() AS attendanceID;
END
//
DELIMITER ;
DELIMITER //

/* this changed from join -> inner join */
DROP PROCEDURE IF EXISTS `GetAllAttendances`;
CREATE PROCEDURE `GetAllAttendances`(my_courseID varchar(255))
BEGIN
    select distinct u.ist_id, u.name, count(distinct ah.attendanceID) as c, co.courseName
    from User u
             inner join AttendanceHistory ah
                        on ah.ist_id = u.ist_id
             inner join Attendance a
                        on a.attendanceID = ah.attendanceID
             inner join Course co
                        on co.courseID = a.courseID
    where a.courseID = my_courseID
      and a.removed=0
      and ah.ist_id not in
          (select ist_id
           from ProfessorTeachesCourse
           where courseID = my_courseID)
    group by ah.ist_id;
END
//
DELIMITER ;

DELIMITER //
DROP PROCEDURE IF EXISTS `CheckFingerprint`;
CREATE PROCEDURE `CheckFingerprint`(my_attendanceID int)
BEGIN
    SELECT distinct f.ist_id
    FROM FingerprintData f, Attendance a, AttendanceHistory ah
    WHERE
            f.attendanceID = my_attendanceID AND
            ah.attendanceID = f.attendanceID AND
            a.attendanceID = f.attendanceID
    group by f.ist_id, f.ip
    having count(*) > 1;
END
//
DELIMITER ;

DELIMITER //
CREATE FUNCTION `CheckAttendance`(my_attendanceID int, my_ist_id varchar(255), my_consecutive_codes int) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE row_sequence INTEGER;
    DECLARE prev_row_sequence INTEGER;
    DECLARE row_correct boolean;
    DECLARE count INTEGER DEFAULT 0;
    DECLARE finished INTEGER DEFAULT 0;
    DECLARE consecutiveTrue CURSOR for
        SELECT sequence, correct
        FROM Code
        WHERE attendanceID = my_attendanceID AND ist_id = my_ist_id
        ORDER BY sequence;

    DECLARE CONTINUE HANDLER
        FOR NOT FOUND SET finished = 1;

    OPEN consecutiveTrue;
    myLoop: LOOP
        FETCH consecutiveTrue INTO row_sequence, row_correct;
        IF finished = 1 THEN
            LEAVE myLoop;
        END IF;
        IF row_correct = 1 THEN
            SET count = count + 1;

            IF count > my_consecutive_codes THEN
                RETURN true;
            END IF;


            IF count > 1 THEN
                IF row_sequence = prev_row_sequence + 1 THEN
                    IF count = my_consecutive_codes THEN
                        CLOSE consecutiveTrue;
                        SELECT ist_id INTO @old_ist_id FROM AttendanceHistory WHERE attendanceID = my_attendanceID AND ist_id = my_ist_id LIMIT 1;
                        IF(@old_ist_id IS NULL) THEN
                            INSERT IGNORE INTO AttendanceHistory(attendanceID, ist_id, success, manually) VALUES (my_attendanceID, my_ist_id, true, false);
                        END IF;
                        RETURN true;
                    END IF;
                ELSE
                    SET count = 1;
                END IF;
            END IF;
        ELSE
            SET count = 0;
        END IF;
        SET prev_row_sequence = row_sequence;
    END LOOP myLoop;
    CLOSE consecutiveTrue;
    RETURN false;
END
//
DELIMITER ;

DELIMITER //
CREATE FUNCTION `CheckAttendance1`(my_attendanceID int, my_ist_id varchar(255), my_consecutive_codes int) RETURNS tinyint(1)
    READS SQL DATA
    DETERMINISTIC
BEGIN
    DECLARE row_sequence INTEGER;
    DECLARE row_correct boolean;
    DECLARE count INTEGER DEFAULT 0;
    DECLARE finished INTEGER DEFAULT 0;
    DECLARE consecutiveTrue CURSOR for
        SELECT sequence, correct
        FROM Code
        WHERE attendanceID = my_attendanceID AND ist_id = my_ist_id
        ORDER BY sequence;

    DECLARE CONTINUE HANDLER
        FOR NOT FOUND SET finished = 1;

    OPEN consecutiveTrue;
    myLoop: LOOP
        FETCH consecutiveTrue INTO row_sequence, row_correct;
        IF finished = 1 THEN
            LEAVE myLoop;
        END IF;
        IF row_correct = 1 THEN
            SET count = count + 1;
            IF count = my_consecutive_codes THEN
                CLOSE consecutiveTrue;
                SELECT ist_id INTO @old_ist_id FROM AttendanceHistory WHERE attendanceID = my_attendanceID AND ist_id = my_ist_id LIMIT 1;
                IF(@old_ist_id IS NULL) THEN
                    INSERT IGNORE INTO AttendanceHistory(attendanceID, ist_id, success, manually) VALUES (my_attendanceID, my_ist_id, true, false);
                END IF;
                RETURN true;
            END IF;
        ELSE
            SET count = 0;
        END IF;
    END LOOP myLoop;
    CLOSE consecutiveTrue;
    RETURN false;
END
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE `InsertOrUpdateFingerprintHistory`(my_ist_id varchar(255), my_indicator_id varchar(255), my_indicator_value text, my_indicator_weight double)
BEGIN
    INSERT INTO FingerprintHistory VALUES (my_ist_id, my_indicator_id, my_indicator_value, my_indicator_weight) ON DUPLICATE KEY UPDATE indicator_value=my_indicator_value, indicator_weight=my_indicator_weight;
END
//
DELIMITER ;


INSERT INTO User(ist_id) VALUES ('ist187664');
INSERT INTO Professor(ist_id) VALUES ('ist187664');
UPDATE User SET role='1' WHERE ist_id='ist187664';

