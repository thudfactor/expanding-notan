This project is a web-based tool designed to make digital versions of the "expanding the square" Notan exercise.

- Since this is the first iteration of this project, consider all efforts to be MVP.
- users are presented with a black square. The area surrounding the black square should be 60% the width of the square on all sides ( at minimum ), and the square should be centered in the space.
- All of the transformations made to the square should be managed in a way that permits multi-level undo.
- The expanding the square rules of notan are the responsibility of the user to follow. We will not attempt to enforce those ourselves.
- users can make "cuts" in the square. These cuts need to be either closed shapes or start and end on a side of the square.
- These cut shapes should be reflected outwards from the square. Users can reflect left, right, up, or down. The reflection axis should be the relevant side. (For example, reflecting to the left side of the square means using the left edge of the square as that axis.)
- Reflected shapes can have additional cuts made to them. These can be reflected back into the square using the same reflection axis rules described above.
- At any point, the user can export either a PNG or an SVG of the resulting image.
- For this initial version, users cannot manually move or rotate a cut shape independently, but we may want to add that capability later.
- For this initial version, users can only draw the paths freehand -- there are no shape or line tools.
- The work in progress should be saved to local storage. This project is front-end only and will have no data back-end.
- We do not save multiple projects.
- Users can create a new project, which will destroy the existing work in progress.
- Provide a "help" dialog box with basic information about the rules of notan.

Desired tech stack:

- Use semantic HTML where possible.
- Use Vite as the project builder.
- Use svelte for the project, and paper.js for the square transformations.

Other instructions:

- As you make architectural decisions on the project, document those in markdown as architecture decision records.
