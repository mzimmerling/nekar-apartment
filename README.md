# Heidelberg apartment

Static English/German website for a furnished family sublet in Heidelberg,
1 February to 31 August 2027. Stays of four to seven months are possible within
this period; longer stays are preferred.

Intended GitHub Pages address:
https://mzimmerling.github.io/nekar-apartment/

Upload these files to the root of `mzimmerling/nekar-apartment`.
In repository Settings → Pages, choose **Deploy from a branch**, then **main**
and **/ (root)**. The `.nojekyll` file disables Jekyll processing.

`index.html` is the English page and `de.html` is the German page. The site is
buildless; its 25-photo gallery, cropped architectural plan, scripts and styles
are all local. No dependencies or API keys are needed.

The pages request `noindex,nofollow`. The website and repository are public;
these indexing requests do not provide access control. Project-site robots.txt
does not control the account-level github.io robots policy, so the page-level
noindex directives are retained on both language versions.

Only the files intended for the public website are included. Original rental
documents, landlord correspondence, the unredacted plan, site credentials and
the previous hosting project's configuration are not included.
