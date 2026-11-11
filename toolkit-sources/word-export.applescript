-- Test: open a Word file, turn on embedding fonts, and save it in place
on run argv
	set inPath to item 1 of argv
	tell application "Microsoft Word"
		close every document saving no
		set d to open (POSIX file inPath)
		delay 3
		set report to "opened"
		try
			set embed true type fonts of active document to true
			set report to report & " embed-set"
		on error e
			set report to report & " embed-fail: " & e
		end try
		try
			save active document
			set report to report & " save-ok"
		on error e
			set report to report & " save-fail: " & e
		end try
		close every document saving no
		return report
	end tell
end run
