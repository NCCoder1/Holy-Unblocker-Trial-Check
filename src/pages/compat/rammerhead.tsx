import type { HolyPage } from '../../App';
import { getDestination } from '../../CompatLayout';
import { RammerheadAPI, StrShuffler } from '../../RammerheadAPI';
import { RH_API } from '../../consts';
import i18n from '../../i18n';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

function patch(url: string) {
	// url = _rhsEPrcb://bqhQko.tHR/
	// remove slash
	return url.replace(/(^.*?:\/)\//, '$1');
}

const Rammerhead: HolyPage = ({ compatLayout }) => {
	const { t } = useTranslation();
	const location = useLocation();

	useEffect(() => {
		(async function () {
			let errorCause: string | undefined;

			try {
				const api = new RammerheadAPI(RH_API);

				// according to our NGINX config
				if (process.env.NODE_ENV === 'production') {
					Cookies.set('auth_proxy', '1', {
						domain: `.${global.location.host}`,
						expires: 1000 * 60 * 60 * 24 * 7, // 1 week
						secure: global.location.protocol === 'https:',
						sameSite: 'lax',
					});

					Cookies.set('origin_proxy', global.location.origin, {
						expires: 1000 * 60 * 60 * 24 * 7, // 1 week
						secure: global.location.protocol === 'https:',
						sameSite: 'lax',
					});
				}

				errorCause = i18n.t('compat.error.unreachable', { what: 'Rammerhead' });
				await fetch(RH_API);
				errorCause = undefined;

				errorCause = i18n.t('compat.error.rammerheadSavedSession');
				if (
					!localStorage.rammerhead_session ||
					!(await api.sessionExists(localStorage.rammerhead_session))
				) {
					errorCause = i18n.t('compat.error.rammerheadNewSession');
					const session = await api.newSession();
					errorCause = undefined;
					localStorage.rammerhead_session = session;
				}

				const session = localStorage.rammerhead_session;

				errorCause = undefined;

				errorCause = i18n.t('compat.error.rammerheadEditSession');
				await api.editSession(session, false, true);
				errorCause = undefined;

				errorCause = i18n.t('compat.error.rammerheadDict');
				const dict = await api.shuffleDict(session);
				errorCause = undefined;

				const shuffler = new StrShuffler(dict);

				global.location.replace(
					new URL(
						`${session}/${patch(shuffler.shuffle(getDestination(location)))}`,
						RH_API
					)
				);
			} catch (err) {
				compatLayout.current!.report(err, errorCause, 'Rammerhead');
			}
		})();
	}, [compatLayout, location]);

	return <main>{t('compat.loading', { what: 'Rammerhead' })}</main>;
};

export default Rammerhead;
