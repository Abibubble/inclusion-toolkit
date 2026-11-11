import { Link } from '../Link';
import { PageHeading } from '../PageHeading';
import { TitleBand } from '../TitleBand';

export function ErrorPage() {
  return (
    <>
      <TitleBand>
        <PageHeading>Sorry, there’s a problem with this page</PageHeading>
      </TitleBand>
      <p>Try again later.</p>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
}
