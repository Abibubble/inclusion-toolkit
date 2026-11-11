-- Test: save a PDF of a PowerPoint file. Usage: osascript pptx-export.applescript in.pptx out.pdf
on run argv
	set inPath to item 1 of argv
	set outPdf to item 2 of argv
	tell application "Microsoft PowerPoint"
		open (POSIX file inPath)
		delay 3
		set report to "opened"
		try
			save active presentation in (POSIX file outPdf) as save as PDF
			set report to report & " pdf-ok"
		on error e
			set report to report & " pdf-fail: " & e
		end try
		delay 30
		close active presentation saving no
		return report
	end tell
end run
