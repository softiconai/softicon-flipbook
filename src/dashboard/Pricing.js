// the Pricing and Free vs Pro tabs; the plans, features and prices come from Freemius (includes/dashboard.php)
import { createInterpolateElement, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Checkout } from '@freemius/checkout';
import { useApi } from './api';
import Status from './Status';
import VideoLink from './VideoLink';
import { videos } from '../utils/options';

const symbols = { usd: '$', eur: '€', gbp: '£', aud: 'A$', cad: 'C$' };

// where people write for help, a refund or anything else
const SUPPORT = 'softiconai@gmail.com';
const mail = <a href={'mailto:' + SUPPORT} />;

// buying without risk: the money-back days set in Freemius, a person to write to, and why we care
const Guarantee = ({ days }) => <div className='alfb-card alfb-guarantee'>
	<span className='dashicons dashicons-shield' aria-hidden='true' />
	<div>
		<h3>{__('Try Pro without risk', 'softicon-flipbook')}</h3>
		<p>{days > 0
			/* translators: %d: number of days */
			? sprintf(__('If Pro is not right for you, tell us within %d days and you get all your money back, no questions asked.', 'softicon-flipbook'), days)
			: __('If Pro is not right for you, tell us and we will make it right.', 'softicon-flipbook')}</p>
		{/* translators: %s: email address */}
		<p>{createInterpolateElement(sprintf(__('Any problem or question? Email us at %s, a real person from our team will help you.', 'softicon-flipbook'), '<a>' + SUPPORT + '</a>'), { a: mail })}</p>
		<p className='alfb-guarantee-why'>{__('We build SoftIcon Flipbook for the people who use it, and your satisfaction comes first.', 'softicon-flipbook')}</p>
	</div>
</div>;

// the short version under a Get Pro button
const MoneyBack = ({ days }) => <p className='alfb-note alfb-promise'>
	<span className='dashicons dashicons-shield' aria-hidden='true' />
	{/* translators: %d: number of days */}
	{days > 0 && sprintf(__('%d-day money-back guarantee', 'softicon-flipbook'), days) + ' · '}
	{/* translators: %s: email address */}
	{createInterpolateElement(sprintf(__('Questions? %s', 'softicon-flipbook'), '<a>' + SUPPORT + '</a>'), { a: mail })}
</p>;

const cycles = () => ({
	lifetime: __('one-time', 'softicon-flipbook'),
	annual: __('per year', 'softicon-flipbook'),
	monthly: __('per month', 'softicon-flipbook')
});

const Price = ({ price }) => <p className='alfb-price'>
	<sup>{symbols[price.currency] || price.currency.toUpperCase() + ' '}</sup>
	{price.price.toLocaleString(undefined, { minimumFractionDigits: Number.isInteger(price.price) ? 0 : 2, maximumFractionDigits: 2 })}
	<span>{cycles()[price.cycle]}</span>
</p>;

const sites = licenses => 'unlimited' === licenses
	? __('Unlimited websites', 'softicon-flipbook')
	/* translators: %d: number of websites */
	: sprintf(_n('%d website', '%d websites', licenses, 'softicon-flipbook'), licenses);

// Get Pro opens the Freemius checkout in a popup; the link opens it in a new tab if that fails
const ProButton = ({ checkout, plan, price, className }) => {
	const href = `${checkout.base}?plan_id=${plan.id}&licenses=${price.licenses}&billing_cycle=${price.cycle}`;
	const open = event => {
		if (event.metaKey || event.ctrlKey || event.shiftKey || 0 !== event.button) {
			return;
		}
		event.preventDefault();
		try {
			new Checkout({ product_id: checkout.product, plan_id: plan.id, public_key: checkout.key })
				.open({ licenses: price.licenses, billing_cycle: price.cycle });
		} catch (error) {
			window.open(href, '_blank', 'noopener');
		}
	};
	return <a className={'alfb-btn alfb-btn-block ' + className} href={href} target='_blank' rel='noopener noreferrer' onClick={open}>
		{__('Get Pro', 'softicon-flipbook')} &rarr;
	</a>;
};

// while Freemius has no paid plan to list, or cannot be reached
const NoPlans = ({ data }) => <div className='alfb-card alfb-no-plans'>
	<span className='dashicons dashicons-clock' aria-hidden='true' />
	<p>{data.error ? __('The Pro plans could not be loaded right now. Please try again later.', 'softicon-flipbook') : __('SoftIcon Flipbook Pro is coming soon.', 'softicon-flipbook')}</p>
</div>;

const Intro = ({ eyebrow, title, children }) => <div className='alfb-intro'>
	<span className='alfb-eyebrow'>{eyebrow}</span>
	<h2>{title}</h2>
	{children}
</div>;

const usePlans = () => useApi('/alfb/v1/dashboard/plans');

// every Pro feature in one minute, played in the dashboard's popup
const ProVideo = ({ play }) => <p><VideoLink url={videos.pro} title={__('Every Pro feature in one minute', 'softicon-flipbook')} play={play}>
	<span className='dashicons dashicons-video-alt3' aria-hidden='true' /> {__('Watch every Pro feature in one minute', 'softicon-flipbook')}
</VideoLink></p>;

export const Pricing = ({ play }) => {
	const { data, error, loading } = usePlans();
	if (loading || error) {
		return <Status error={error} />;
	}
	const plan = data.pro;
	const once = plan && 'lifetime' === plan.prices[0].cycle;

	return <>
		<Intro eyebrow={__('Pricing', 'softicon-flipbook')} title={once ? __('Pay once, use it for life', 'softicon-flipbook') : __('Pick your plan', 'softicon-flipbook')}>
			<p>{__('Every plan has all Pro features; pick how many websites you need.', 'softicon-flipbook')}</p>
			<ProVideo play={play} />
		</Intro>

		{plan ? <div className='alfb-plans alfb-plans-3'>
			{plan.prices.map(price => <div className='alfb-plan' key={price.licenses}>
				<span className='alfb-tag'>{sites(price.licenses)}</span>
				<h3>{plan.title}</h3>
				<Price price={price} />
				<ProButton checkout={data.checkout} plan={plan} price={price} className='alfb-btn-teal' />
				<ul className='alfb-checks'>
					<li>{sites(price.licenses)}</li>
					<li>{__('Every free feature', 'softicon-flipbook')}</li>
					{data.pro_only.map(feature => <li key={feature.title}>{feature.title}</li>)}
				</ul>
			</div>)}
		</div> : <NoPlans data={data} />}

		{plan && <Guarantee days={data.money_back} />}

		<p className='alfb-note'>
			{__('Secure checkout by Freemius. Pro replaces the free plugin and keeps every book you made.', 'softicon-flipbook')}{' '}
			<a href='#/compare'>{__('Compare Free and Pro', 'softicon-flipbook')}</a>
		</p>
	</>;
};

const Mark = ({ yes }) => <span className={'alfb-mark ' + (yes ? 'is-yes' : 'is-no')}>
	<span className={'dashicons ' + (yes ? 'dashicons-yes' : 'dashicons-no-alt')} aria-hidden='true' />
	<span className='screen-reader-text'>{yes ? __('Included', 'softicon-flipbook') : __('Not included', 'softicon-flipbook')}</span>
</span>;

export const Compare = ({ play }) => {
	const { data, error, loading } = usePlans();
	const [filter, setFilter] = useState('');
	if (loading || error) {
		return <Status error={error} />;
	}
	const plan = data.pro;

	// a section whose name matches keeps all its rows
	const words = filter.trim().toLowerCase();
	const sections = [
		[__('In Free and Pro', 'softicon-flipbook'), data.free, true],
		[__('Only in Pro', 'softicon-flipbook'), data.pro_only, false]
	].map(([title, features, free]) => [title, features.filter(feature => !words || title.toLowerCase().includes(words) || (feature.title + ' ' + feature.text).toLowerCase().includes(words)), free])
		.filter(([, features]) => features.length);
	const hasFeatures = data.free.length > 0 || data.pro_only.length > 0;

	return <>
		<Intro eyebrow={__('Compare', 'softicon-flipbook')} title={__('Free vs Pro at a glance', 'softicon-flipbook')}>
			{data.pro_only.length > 0 && <p>
				{/* translators: %s: number of features */}
				{createInterpolateElement(sprintf(__('See what you get when you upgrade. %s features are only in Pro.', 'softicon-flipbook'), '<strong>' + data.pro_only.length.toLocaleString() + '</strong>'), { strong: <strong /> })}
			</p>}
			<ProVideo play={play} />
		</Intro>

		<div className='alfb-plans'>
			<div className='alfb-plan'>
				<span className='alfb-tag'>{__('Free', 'softicon-flipbook')}</span>
				<h3>{__('Free', 'softicon-flipbook')}</h3>
				<p>{__('Free forever, everything you need to put books on your site.', 'softicon-flipbook')}</p>
				<p className='alfb-price'><sup>$</sup>0<span>{__('forever', 'softicon-flipbook')}</span></p>
				<span className='alfb-have'><span className='dashicons dashicons-yes' aria-hidden='true' />{__('You already have it', 'softicon-flipbook')}</span>
			</div>
			{plan && <div className='alfb-plan is-pro'>
				<span className='alfb-tag'>{__('Pro', 'softicon-flipbook')}</span>
				<h3>{plan.title}</h3>
				{plan.text && <p>{plan.text}</p>}
				<Price price={plan.prices[0]} />
				<ProButton checkout={data.checkout} plan={plan} price={plan.prices[0]} className='alfb-btn-light' />
				{plan.prices.length > 1 && <a className='alfb-more-plans' href='#/pricing'>{__('Plans for more websites', 'softicon-flipbook')}</a>}
			</div>}
		</div>

		{plan && <MoneyBack days={data.money_back} />}

		{!plan && <NoPlans data={data} />}

		{hasFeatures && <section className='alfb-breakdown'>
			<header>
				<h3 id='alfb-breakdown-title'>{__('Feature breakdown', 'softicon-flipbook')}</h3>
				<label className='alfb-filter'>
					<span className='dashicons dashicons-search' aria-hidden='true' />
					<span className='screen-reader-text'>{__('Filter features', 'softicon-flipbook')}</span>
					<input type='search' placeholder={__('Filter features…', 'softicon-flipbook')} value={filter} onChange={event => setFilter(event.target.value)} />
				</label>
			</header>
			<table className='alfb-compare' aria-labelledby='alfb-breakdown-title'>
				<thead><tr>
					<th scope='col'>{__('Feature', 'softicon-flipbook')}</th>
					<th scope='col'>{__('Free', 'softicon-flipbook')}</th>
					<th scope='col' className='is-pro'>{__('Pro', 'softicon-flipbook')}</th>
				</tr></thead>
				{sections.map(([title, features, free]) => <tbody key={title}>
					<tr className='alfb-group'><th scope='rowgroup' colSpan='3'>{title}</th></tr>
					{features.map(feature => <tr key={feature.title}>
						<th scope='row'>{feature.title}{feature.text && <small>{feature.text}</small>}</th>
						<td><Mark yes={free} /></td>
						<td><Mark yes /></td>
					</tr>)}
				</tbody>)}
				{!sections.length && <tbody className='alfb-empty'><tr><td colSpan='3'>{__('No features match.', 'softicon-flipbook')}</td></tr></tbody>}
			</table>
		</section>}
	</>;
};
