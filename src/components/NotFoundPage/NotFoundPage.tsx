import { Link } from '../Link';
import { PageHeading } from '../PageHeading';
import { TitleBand } from '../TitleBand';

export function NotFoundPage() {
  return (
    <>
      <TitleBand>
        <PageHeading>Page not found</PageHeading>
      </TitleBand>
      <p>If you typed the web address, check it’s correct.</p>
      <p>If you pasted the web address, check you copied the whole address.</p>
      <p>
        You can <Link to="/">go to the home page</Link>, or use the links at the top of the page to
        find what you’re looking for.
      </p>
    </>
  );
}
